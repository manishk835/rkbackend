// src/routes/withdrawal.routes.js

const express = require(
   "express"
 );
 
 const router = express.Router();
 
 /* ======================================================
    CONTROLLERS
 ====================================================== */
 
 const {
   createWithdrawal,
   getSellerWithdrawals,
   approveWithdrawal,
   rejectWithdrawal,
   getAllWithdrawals,
 } = require(
   "../controllers/withdrawal.controller"
 );
 
 /* ======================================================
    MIDDLEWARES
 ====================================================== */
 
 const {
   protect,
   requireRole,
   approvedSeller,
 } = require(
   "../middlewares/auth.middleware"
 );
 
 const {
   adminAuth,
 } = require(
   "../middlewares/admin.middleware"
 );
 
 const rateLimit = require(
   "express-rate-limit"
 );
 
 /* ======================================================
    RATE LIMITERS
 ====================================================== */
 
 const sellerLimiter =
   rateLimit({
     windowMs:
       10 * 60 * 1000,
 
     max: 20,
 
     standardHeaders:
       true,
 
     legacyHeaders:
       false,
 
     message: {
       message:
         "Too many withdrawal requests",
     },
   });
 
 const adminLimiter =
   rateLimit({
     windowMs:
       10 * 60 * 1000,
 
     max: 100,
 
     standardHeaders:
       true,
 
     legacyHeaders:
       false,
 
     message: {
       message:
         "Too many admin requests",
     },
   });
 
 /* ======================================================
    SELLER ACCESS
 ====================================================== */
 
 const sellerAccess = [
   protect,
 
   requireRole(
     "seller"
   ),
 
   approvedSeller,
 ];
 
 /* ======================================================
    🧑 SELLER ROUTES
 ====================================================== */
 
 /*
 POST
 /api/withdrawals
 Create withdrawal request
 */
 
 router.post(
   "/",
 
   sellerLimiter,
 
   sellerAccess,
 
   createWithdrawal
 );
 
 /*
 GET
 /api/withdrawals/my
 Seller withdrawal history
 */
 
 router.get(
   "/my",
 
   sellerLimiter,
 
   sellerAccess,
 
   getSellerWithdrawals
 );
 
 /* ======================================================
    🛠 ADMIN ROUTES
 ====================================================== */
 
 router.use(
   adminAuth,
   adminLimiter
 );
 
 /*
 GET
 /api/withdrawals
 Get all withdrawals
 */
 
 router.get(
   "/",
 
   getAllWithdrawals
 );
 
 /*
 PATCH
 /api/withdrawals/:id/approve
 Approve withdrawal
 */
 
 router.patch(
   "/:id/approve",
 
   approveWithdrawal
 );
 
 /*
 PATCH
 /api/withdrawals/:id/reject
 Reject withdrawal
 */
 
 router.patch(
   "/:id/reject",
 
   rejectWithdrawal
 );
 
 /* ======================================================
    EXPORT
 ====================================================== */
 
 module.exports = router;