import { Router } from 'express';
import { 
    createCheckout, 
    createPortalSession, 
    getSubscriptionStatus,
    cancelUserSubscription,
    handleStripeWebhook,
    debugUserPlan,
    syncSubscription
} from '../controller/subscription.controller.js';
import { isAuthenticated } from '../middleware/AuthToken.js';
import express from 'express';

const router = Router();

/**
 * @route   POST /api/subscription/create-checkout
 * @desc    Create a Stripe checkout session
 * @access  Private
 */
router.post('/create-checkout', isAuthenticated, createCheckout);

/**
 * @route   POST /api/subscription/create-portal
 * @desc    Create a Stripe billing portal session
 * @access  Private
 */
router.post('/create-portal', isAuthenticated, createPortalSession);

/**
 * @route   GET /api/subscription/status
 * @desc    Get current subscription status
 * @access  Private
 */
router.get('/status', isAuthenticated, getSubscriptionStatus);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel current subscription
 * @access  Private
 */
router.post('/cancel', isAuthenticated, cancelUserSubscription);

/**
 * @route   GET /api/subscription/debug
 * @desc    Debug endpoint to check user's plan from all sources
 * @access  Private
 */
router.get('/debug', isAuthenticated, debugUserPlan);

/**
 * @route   POST /api/subscription/sync
 * @desc    Manually sync subscription from Stripe (in case webhook failed)
 * @access  Private
 */
router.post('/sync', isAuthenticated, syncSubscription);

/**
 * @route   POST /api/subscription/webhook
 * @desc    Handle Stripe webhooks
 * @access  Public (verified by Stripe signature)
 * @note    This endpoint must receive raw body, not JSON parsed
 */
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
);

export default router;
