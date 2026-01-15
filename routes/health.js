const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/health', async (req, res) => {
    const health = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        status: 'OK',
        checks: {
            database: 'unknown',
            memory: 'unknown',
        }
    };

    try {
        // Check database connection
        if (mongoose.connection.readyState === 1) {
            health.checks.database = 'connected';
        } else {
            health.checks.database = 'disconnected';
            health.status = 'DEGRADED';
        }

        // Check memory usage
        const memUsage = process.memoryUsage();
        const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        health.checks.memory = `${memUsageMB}MB`;

        if (memUsageMB > 500) {
            health.status = 'WARNING';
        }

        res.status(health.status === 'OK' ? 200 : 503).json(health);
    } catch (error) {
        health.status = 'ERROR';
        health.error = error.message;
        res.status(503).json(health);
    }
});

router.get('/health/ready', async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        res.status(200).json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({ status: 'not ready', error: error.message });
    }
});

module.exports = router;
