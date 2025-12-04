const WebSocket = require('ws');
const mongoose = require('mongoose');
const Booking = require('../models/booking');

module.exports = function setupWebSocket(server) {
    const wss = new WebSocket.Server({ 
        server,
        // Handle errors at the WSS level
        verifyClient: (info, cb) => {
            // You can add authentication here if needed
            cb(true);
        }
    });

    // Handle server-level errors
    wss.on('error', (error) => {
        console.error('WebSocket Server Error:', error);
    });

    wss.on('connection', function connection(ws, req) {
        console.log('New WebSocket connection');

        // Set up a ping interval to keep the connection alive
        const pingInterval = setInterval(() => {
            if (ws.isAlive === false) {
                clearInterval(pingInterval);
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        }, 30000);

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('error', (error) => {
            console.error('WebSocket Client Error:', error);
        });

        // Listen for booking changes using MongoDB Change Streams
        let bookingChangeStream;
        try {
            bookingChangeStream = Booking.watch();

            bookingChangeStream.on('error', (error) => {
                console.error('Change Stream Error:', error);
            });

            bookingChangeStream.on('change', async (change) => {
            if (change.operationType === 'insert' || 
                change.operationType === 'update' || 
                change.operationType === 'delete') {
                
                try {
                    const booking = change.fullDocument;
                    if (!booking) return;

                    let type, itemId;
                    if (booking.listing) {
                        type = 'listing_booking';
                        itemId = booking.listing.toString();
                    } else if (booking.vehicle) {
                        type = 'vehicle_booking';
                        itemId = booking.vehicle.toString();
                    }

                    if (type && itemId) {
                        const message = JSON.stringify({ type, itemId });
                        wss.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(message);
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error processing booking change:', error);
                }
            }
        });

        ws.on('close', () => {
            clearInterval(pingInterval);
            if (bookingChangeStream) {
                bookingChangeStream.close();
            }
        });
        
        } catch (error) {
            console.error('Error setting up change stream:', error);
        }
    });

    // Clean up on server close
    server.on('close', () => {
        wss.clients.forEach(client => {
            client.terminate();
        });
    });

    return wss;
}