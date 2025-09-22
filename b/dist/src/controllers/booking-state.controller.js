"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingState = updateBookingState;
const booking_state_schemas_1 = require("../validators/booking.state.schemas");
const booking_state_service_1 = require("../services/booking.state.service");
async function updateBookingState(req, res) {
    try {
        const idParsed = booking_state_schemas_1.bookingIdParam.safeParse(req.params);
        if (!idParsed.success)
            return res.status(400).json({ error: 'Invalid booking id' });
        const bodyParsed = booking_state_schemas_1.updateBookingStateBody.safeParse(req.body);
        if (!bodyParsed.success) {
            return res.status(400).json({ error: 'Validation failed', issues: bodyParsed.error.issues });
        }
        const userId = req.userId;
        const userRole = req.userRole;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const result = await (0, booking_state_service_1.transitionBookingState)({
            bookingId: idParsed.data.id,
            actorUserId: userId,
            actorRole: userRole,
            toState: bodyParsed.data.toState,
            reason: bodyParsed.data.reason,
        });
        return res.json(result);
    }
    catch (err) {
        const msg = err?.message || 'Could not update booking state';
        if (/not found/i.test(msg))
            return res.status(404).json({ error: msg });
        if (/Forbidden|not a participant|Transition not allowed/i.test(msg)) {
            return res.status(403).json({ error: msg });
        }
        return res.status(400).json({ error: msg });
    }
}
