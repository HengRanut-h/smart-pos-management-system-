<?php

namespace App\Modules\Delivery\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Delivery\Persistence\Models\DeliverySupportTicket;
use App\Modules\Delivery\Persistence\Models\DeliveryAuditLog;

class DeliverySupportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DeliverySupportTicket::with(['delivery', 'customer', 'driver', 'assignedUser']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        $tickets = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $tickets,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'delivery_id' => 'required|exists:deliveries,id',
            'customer_id' => 'nullable|exists:customers,id',
            'driver_id' => 'nullable|exists:delivery_drivers,id',
            'issue_type' => 'required|string',
            'priority' => 'required|string',
            'description' => 'required|string',
        ]);

        $ticketNumber = 'TCK-' . date('Ymd') . '-' . rand(1000, 9999);

        $ticket = DeliverySupportTicket::create([
            'ticket_number' => $ticketNumber,
            'delivery_id' => $data['delivery_id'],
            'customer_id' => $data['customer_id'] ?? null,
            'driver_id' => $data['driver_id'] ?? null,
            'issue_type' => $data['issue_type'],
            'priority' => $data['priority'],
            'description' => $data['description'],
            'status' => 'OPEN',
        ]);

        DeliveryAuditLog::create([
            'delivery_id' => $data['delivery_id'],
            'actor_name' => 'Support Agent',
            'action' => 'SUPPORT_TICKET_OPENED',
            'new_value' => $ticketNumber,
            'reason' => $data['issue_type'] . ': ' . $data['description'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Support issue ticket logged successfully',
            'data' => $ticket->load(['delivery', 'customer', 'driver']),
        ], 201);
    }

    public function resolve(Request $request, int $id): JsonResponse
    {
        $ticket = DeliverySupportTicket::findOrFail($id);
        $request->validate(['resolution_notes' => 'required|string']);

        $ticket->update([
            'status' => 'RESOLVED',
            'resolution_notes' => $request->resolution_notes,
            'resolved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket marked as resolved',
            'data' => $ticket,
        ]);
    }
}
