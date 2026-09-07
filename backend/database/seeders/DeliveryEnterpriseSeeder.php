<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\Delivery\Persistence\Models\DeliveryVehicle;
use App\Modules\Delivery\Persistence\Models\DeliveryVehicleMaintenance;
use App\Modules\Delivery\Persistence\Models\DeliveryFeeRule;
use App\Modules\Delivery\Persistence\Models\DeliveryTimeSlot;
use App\Modules\Delivery\Persistence\Models\CustomerDeliveryAddress;
use App\Modules\Delivery\Persistence\Models\DeliveryRoute;
use App\Modules\Delivery\Persistence\Models\DeliveryRouteStop;
use App\Modules\Delivery\Persistence\Models\DeliverySupportTicket;
use App\Modules\Delivery\Persistence\Models\DeliveryRating;
use App\Modules\Delivery\Persistence\Models\Delivery;
use App\Modules\Delivery\Persistence\Models\DeliveryDriver;

class DeliveryEnterpriseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Time Slots
        if (DeliveryTimeSlot::count() === 0) {
            $slots = [
                ['slot_code' => 'SLOT-ASAP', 'label' => '⚡ ASAP (Within 45 Mins)', 'start_time' => '07:00:00', 'end_time' => '22:00:00', 'max_capacity' => 50],
                ['slot_code' => 'SLOT-MORNING-1', 'label' => '🌅 Morning (08:00 - 10:00)', 'start_time' => '08:00:00', 'end_time' => '10:00:00', 'max_capacity' => 25],
                ['slot_code' => 'SLOT-MORNING-2', 'label' => '☀️ Late Morning (10:00 - 12:00)', 'start_time' => '10:00:00', 'end_time' => '12:00:00', 'max_capacity' => 30],
                ['slot_code' => 'SLOT-AFTERNOON-1', 'label' => '🌤️ Early Afternoon (13:00 - 15:00)', 'start_time' => '13:00:00', 'end_time' => '15:00:00', 'max_capacity' => 25],
                ['slot_code' => 'SLOT-AFTERNOON-2', 'label' => '☕ Late Afternoon (15:00 - 17:00)', 'start_time' => '15:00:00', 'end_time' => '17:00:00', 'max_capacity' => 30],
                ['slot_code' => 'SLOT-EVENING-1', 'label' => '🌆 Evening (17:00 - 19:00)', 'start_time' => '17:00:00', 'end_time' => '19:00:00', 'max_capacity' => 35],
                ['slot_code' => 'SLOT-NIGHT', 'label' => '🌙 Night (19:00 - 21:00)', 'start_time' => '19:00:00', 'end_time' => '21:00:00', 'max_capacity' => 20],
            ];
            foreach ($slots as $s) {
                DeliveryTimeSlot::create($s);
            }
        }

        // 2. Fee Rules
        if (DeliveryFeeRule::count() === 0) {
            DeliveryFeeRule::create([
                'name' => 'Small Order Delivery',
                'rule_type' => 'ORDER_VALUE',
                'min_order_value' => 0,
                'max_order_value' => 10,
                'fee_amount' => 2.00,
                'is_free' => false,
                'peak_hour_surcharge' => 0.50,
                'weekend_surcharge' => 0.25,
            ]);
            DeliveryFeeRule::create([
                'name' => 'Standard Order Delivery',
                'rule_type' => 'ORDER_VALUE',
                'min_order_value' => 10,
                'max_order_value' => 30,
                'fee_amount' => 1.00,
                'is_free' => false,
                'peak_hour_surcharge' => 0.50,
            ]);
            DeliveryFeeRule::create([
                'name' => 'VIP Free Delivery Over $30',
                'rule_type' => 'ORDER_VALUE',
                'min_order_value' => 30,
                'max_order_value' => 99999,
                'fee_amount' => 0.00,
                'is_free' => true,
            ]);
        }

        // 3. Vehicles
        if (DeliveryVehicle::count() === 0) {
            $v1 = DeliveryVehicle::create([
                'plate_number' => 'Phnom Penh 1AB-2345',
                'vehicle_type' => 'MOTORCYCLE',
                'brand' => 'Honda',
                'model' => 'Scoopy 2024',
                'color' => 'Pearl White',
                'capacity_kg' => 25,
                'fuel_type' => 'GASOLINE',
                'assigned_driver_id' => 1,
                'status' => 'AVAILABLE',
                'mileage_km' => 4520,
                'next_service_date' => now()->addDays(45),
            ]);
            $v2 = DeliveryVehicle::create([
                'plate_number' => 'Phnom Penh 1CD-6789',
                'vehicle_type' => 'MOTORCYCLE',
                'brand' => 'Yamaha',
                'model' => 'QBIX 125',
                'color' => 'Matte Black',
                'capacity_kg' => 30,
                'fuel_type' => 'GASOLINE',
                'assigned_driver_id' => 2,
                'status' => 'IN_USE',
                'mileage_km' => 8940,
                'next_service_date' => now()->addDays(15),
            ]);
            $v3 = DeliveryVehicle::create([
                'plate_number' => 'Phnom Penh 2A-4455',
                'vehicle_type' => 'VAN',
                'brand' => 'Toyota',
                'model' => 'Probox Cargo',
                'color' => 'Silver',
                'capacity_kg' => 450,
                'fuel_type' => 'DIESEL',
                'assigned_driver_id' => 4,
                'status' => 'AVAILABLE',
                'mileage_km' => 34200,
                'next_service_date' => now()->addDays(30),
            ]);

            DeliveryVehicleMaintenance::create([
                'vehicle_id' => $v1->id,
                'service_type' => 'OIL_CHANGE',
                'service_date' => now()->subDays(20),
                'cost' => 12.50,
                'mileage_at_service' => 4000,
                'notes' => 'Full synthetic 10W-30 engine oil replaced',
                'technician_name' => 'Kravanh Moto Shop',
            ]);
        }

        // 4. Customer Delivery Address
        if (CustomerDeliveryAddress::count() === 0) {
            CustomerDeliveryAddress::create([
                'customer_id' => 1,
                'label' => 'Home',
                'recipient_name' => 'Sokha Mean',
                'recipient_phone' => '012 888 777',
                'province' => 'Phnom Penh',
                'district' => 'Chamkarmon',
                'commune' => 'Boeung Keng Kang 1',
                'street' => 'St 51',
                'house_number' => '#12B',
                'full_address' => '#12B, St 51, Sangkat BKK1, Khan Chamkarmon, Phnom Penh',
                'latitude' => 11.551,
                'longitude' => 104.925,
                'landmark' => 'Near Brown Coffee 51',
                'delivery_instructions' => 'Ring bell twice, guard at gate will accept package.',
                'is_default' => true,
            ]);
            CustomerDeliveryAddress::create([
                'customer_id' => 1,
                'label' => 'Office',
                'recipient_name' => 'Sokha Mean',
                'recipient_phone' => '012 888 777',
                'province' => 'Phnom Penh',
                'district' => 'Daun Penh',
                'commune' => 'Wat Phnom',
                'street' => 'Preah Monivong Blvd',
                'house_number' => 'Vattanac Tower Floor 12',
                'full_address' => 'Vattanac Capital Tower, Floor 12, Preah Monivong Blvd, Daun Penh, Phnom Penh',
                'latitude' => 11.5724,
                'longitude' => 104.9198,
                'landmark' => 'Near Central Market',
                'delivery_instructions' => 'Leave at front reception desk.',
                'is_default' => false,
            ]);
        }

        // 5. Support Ticket
        if (DeliverySupportTicket::count() === 0 && Delivery::count() > 0) {
            $firstDel = Delivery::first();
            DeliverySupportTicket::create([
                'ticket_number' => 'TCK-20260908-001',
                'delivery_id' => $firstDel->id,
                'customer_id' => $firstDel->customer_id,
                'driver_id' => $firstDel->driver_id,
                'issue_type' => 'LATE_DELIVERY',
                'priority' => 'HIGH',
                'description' => 'Customer requested update on estimated arrival window due to heavy rain in Toul Kork.',
                'status' => 'INVESTIGATING',
            ]);
        }

        // 6. Delivery Rating
        if (DeliveryRating::count() === 0 && Delivery::where('status', 'DELIVERED')->count() > 0) {
            $del = Delivery::where('status', 'DELIVERED')->first();
            DeliveryRating::create([
                'delivery_id' => $del->id,
                'customer_id' => $del->customer_id,
                'driver_id' => $del->driver_id,
                'overall_rating' => 5.0,
                'driver_rating' => 5.0,
                'speed_rating' => 4.8,
                'communication_rating' => 5.0,
                'package_rating' => 5.0,
                'review_text' => 'Super fast delivery! Rider was very polite and package was handled with great care.',
            ]);
        }

        // 7. Route & Stops
        if (DeliveryRoute::count() === 0 && Delivery::count() >= 2) {
            $deliveries = Delivery::take(3)->get();
            $route = DeliveryRoute::create([
                'route_code' => 'ROUTE-' . date('Ymd') . '-A101',
                'driver_id' => 2,
                'vehicle_id' => 2,
                'status' => 'IN_PROGRESS',
                'route_date' => now()->toDateString(),
                'total_distance_km' => 12.8,
                'estimated_duration_minutes' => 65,
                'total_stops' => $deliveries->count(),
                'completed_stops' => 1,
                'notes' => 'Toul Kork & Downtown express multi-stop loop',
            ]);

            foreach ($deliveries as $idx => $d) {
                DeliveryRouteStop::create([
                    'route_id' => $route->id,
                    'delivery_id' => $d->id,
                    'sequence_order' => $idx + 1,
                    'status' => $idx === 0 ? 'DELIVERED' : ($idx === 1 ? 'ARRIVED' : 'PENDING'),
                    'estimated_arrival_time' => date('H:i', strtotime('+' . (($idx + 1) * 20) . ' minutes')),
                    'actual_arrival_time' => $idx === 0 ? now()->subMinutes(30) : null,
                    'distance_from_prev_km' => 4.2,
                ]);
            }
        }
    }
}
