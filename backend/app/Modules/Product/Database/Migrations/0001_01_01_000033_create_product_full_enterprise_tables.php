<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Extend products table with enterprise fields
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'product_type')) {
                $table->string('product_type', 50)->default('SIMPLE')->index()->after('name');
            }
            if (!Schema::hasColumn('products', 'product_code')) {
                $table->string('product_code', 100)->nullable()->index()->after('product_type');
            }
            if (!Schema::hasColumn('products', 'short_description')) {
                $table->text('short_description')->nullable()->after('description');
            }
            if (!Schema::hasColumn('products', 'gallery_images')) {
                $table->json('gallery_images')->nullable()->after('image_url');
            }
            if (!Schema::hasColumn('products', 'tags')) {
                $table->json('tags')->nullable()->after('gallery_images');
            }
            if (!Schema::hasColumn('products', 'wholesale_price')) {
                $table->decimal('wholesale_price', 19, 4)->default(0)->after('selling_price');
            }
            if (!Schema::hasColumn('products', 'vip_price')) {
                $table->decimal('vip_price', 19, 4)->default(0)->after('wholesale_price');
            }
            if (!Schema::hasColumn('products', 'member_price')) {
                $table->decimal('member_price', 19, 4)->default(0)->after('vip_price');
            }
            if (!Schema::hasColumn('products', 'online_price')) {
                $table->decimal('online_price', 19, 4)->default(0)->after('member_price');
            }
            if (!Schema::hasColumn('products', 'landed_cost')) {
                $table->decimal('landed_cost', 19, 4)->default(0)->after('cost_price');
            }
            if (!Schema::hasColumn('products', 'shipping_cost')) {
                $table->decimal('shipping_cost', 19, 4)->default(0)->after('landed_cost');
            }
            if (!Schema::hasColumn('products', 'import_tax')) {
                $table->decimal('import_tax', 19, 4)->default(0)->after('shipping_cost');
            }
            if (!Schema::hasColumn('products', 'handling_cost')) {
                $table->decimal('handling_cost', 19, 4)->default(0)->after('import_tax');
            }
            if (!Schema::hasColumn('products', 'other_expenses')) {
                $table->decimal('other_expenses', 19, 4)->default(0)->after('handling_cost');
            }
            if (!Schema::hasColumn('products', 'safety_stock')) {
                $table->decimal('safety_stock', 19, 4)->default(0)->after('max_stock');
            }
            if (!Schema::hasColumn('products', 'reorder_quantity')) {
                $table->decimal('reorder_quantity', 19, 4)->default(0)->after('safety_stock');
            }
            if (!Schema::hasColumn('products', 'opening_stock')) {
                $table->decimal('opening_stock', 19, 4)->default(0)->after('reorder_quantity');
            }
            if (!Schema::hasColumn('products', 'damaged_stock')) {
                $table->decimal('damaged_stock', 19, 4)->default(0)->after('opening_stock');
            }
            if (!Schema::hasColumn('products', 'expired_stock')) {
                $table->decimal('expired_stock', 19, 4)->default(0)->after('damaged_stock');
            }
            if (!Schema::hasColumn('products', 'in_transit_stock')) {
                $table->decimal('in_transit_stock', 19, 4)->default(0)->after('expired_stock');
            }
            if (!Schema::hasColumn('products', 'dimensions')) {
                $table->string('dimensions', 100)->nullable()->after('weight');
            }
            if (!Schema::hasColumn('products', 'seo_slug')) {
                $table->string('seo_slug', 255)->nullable()->index()->after('dimensions');
            }
            if (!Schema::hasColumn('products', 'seo_title')) {
                $table->string('seo_title', 255)->nullable()->after('seo_slug');
            }
            if (!Schema::hasColumn('products', 'seo_description')) {
                $table->text('seo_description')->nullable()->after('seo_title');
            }
            if (!Schema::hasColumn('products', 'meta_keywords')) {
                $table->string('meta_keywords', 500)->nullable()->after('seo_description');
            }
            if (!Schema::hasColumn('products', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('meta_keywords');
            }
            if (!Schema::hasColumn('products', 'is_new')) {
                $table->boolean('is_new')->default(false)->after('is_featured');
            }
            if (!Schema::hasColumn('products', 'is_discontinued')) {
                $table->boolean('is_discontinued')->default(false)->after('is_new');
            }
            if (!Schema::hasColumn('products', 'visibility')) {
                $table->json('visibility')->nullable()->after('is_discontinued');
            }
            if (!Schema::hasColumn('products', 'rating_avg')) {
                $table->decimal('rating_avg', 3, 2)->default(0)->after('visibility');
            }
            if (!Schema::hasColumn('products', 'rating_count')) {
                $table->integer('rating_count')->default(0)->after('rating_avg');
            }
            if (!Schema::hasColumn('products', 'template_id')) {
                $table->unsignedBigInteger('template_id')->nullable()->after('rating_count');
            }
        });

        // 2. Product Variants
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('sku', 100)->unique();
            $table->string('barcode', 100)->nullable()->index();
            $table->string('variant_name', 255);
            $table->json('attribute_values')->nullable();
            $table->decimal('cost_price', 19, 4)->default(0);
            $table->decimal('selling_price', 19, 4)->default(0);
            $table->decimal('wholesale_price', 19, 4)->default(0);
            $table->decimal('weight', 19, 4)->nullable();
            $table->string('dimensions', 100)->nullable();
            $table->decimal('stock_quantity', 19, 4)->default(0);
            $table->string('image_url', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Product Attributes
        Schema::create('product_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('cascade');
            $table->string('name', 100);
            $table->string('code', 50)->index();
            $table->string('type', 50)->default('SELECT');
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_filterable')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 4. Product Attribute Values
        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained('product_attributes')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->onDelete('cascade');
            $table->string('value', 255);
            $table->timestamps();
        });

        // 5. Unit Conversions
        Schema::create('unit_conversions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_unit_id')->constrained('units')->onDelete('cascade');
            $table->foreignId('to_unit_id')->constrained('units')->onDelete('cascade');
            $table->decimal('multiplier', 19, 4);
            $table->string('description', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 6. Product Price Rules
        Schema::create('product_price_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('cascade');
            $table->string('name', 150);
            $table->string('rule_type', 50);
            $table->decimal('price_value', 19, 4);
            $table->integer('min_quantity')->nullable();
            $table->unsignedBigInteger('customer_group_id')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 7. Product Warehouse Bin Locations
        Schema::create('product_warehouse_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->string('zone', 50)->nullable();
            $table->string('rack', 50)->nullable();
            $table->string('shelf', 50)->nullable();
            $table->string('bin', 50)->nullable();
            $table->decimal('quantity', 19, 4)->default(0);
            $table->timestamps();
        });

        // 8. Product Suppliers
        Schema::create('product_suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->string('supplier_sku', 100)->nullable();
            $table->decimal('supplier_price', 19, 4);
            $table->integer('minimum_order_qty')->default(1);
            $table->integer('lead_time_days')->default(3);
            $table->boolean('is_preferred')->default(false);
            $table->string('supplier_barcode', 100)->nullable();
            $table->timestamps();
        });

        // 9. Product Bundles
        Schema::create('product_bundles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bundle_product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('component_product_id')->constrained('products')->onDelete('cascade');
            $table->decimal('quantity', 19, 4)->default(1);
            $table->decimal('unit_price_override', 19, 4)->nullable();
            $table->timestamps();
        });

        // 10. Product BOM
        Schema::create('product_boms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('raw_material_product_id')->constrained('products')->onDelete('cascade');
            $table->decimal('quantity_required', 19, 4);
            $table->decimal('unit_cost', 19, 4)->nullable();
            $table->decimal('waste_percentage', 5, 2)->default(0);
            $table->decimal('scrap_rate', 5, 2)->default(0);
            $table->timestamps();
        });

        // 11. Batches & Lots
        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('batch_number', 100)->index();
            $table->string('lot_number', 100)->nullable();
            $table->date('manufacturing_date')->nullable();
            $table->date('expiry_date')->nullable()->index();
            $table->decimal('quantity', 19, 4)->default(0);
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->decimal('unit_cost', 19, 4)->nullable();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->onDelete('set null');
            $table->string('status', 50)->default('FRESH');
            $table->timestamps();
        });

        // 12. Serial Numbers & IMEI
        Schema::create('product_serial_numbers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('serial_number', 150)->unique();
            $table->string('imei', 100)->nullable()->index();
            $table->string('status', 50)->default('AVAILABLE');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->foreignId('sale_id')->nullable()->constrained('sales')->onDelete('set null');
            $table->date('warranty_expiry_date')->nullable();
            $table->timestamps();
        });

        // 13. Warranties
        Schema::create('product_warranties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('sale_id')->nullable()->constrained('sales')->onDelete('set null');
            $table->string('serial_number', 150)->nullable();
            $table->integer('warranty_period_months')->default(12);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('warranty_type', 50)->default('MANUFACTURER');
            $table->string('provider', 150)->nullable();
            $table->text('terms')->nullable();
            $table->string('claim_status', 50)->default('ACTIVE');
            $table->timestamps();
        });

        // 14. QC Inspections
        Schema::create('product_qc_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('batch_id')->nullable()->constrained('product_batches')->onDelete('set null');
            $table->date('inspection_date');
            $table->string('inspector_name', 150);
            $table->integer('sample_size')->default(1);
            $table->integer('passed_quantity')->default(0);
            $table->integer('failed_quantity')->default(0);
            $table->string('defect_type', 100)->nullable();
            $table->string('status', 50)->default('PASSED');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 15. Reviews
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->string('customer_name', 150);
            $table->unsignedTinyInteger('rating')->default(5);
            $table->string('review_title', 255)->nullable();
            $table->text('review_text')->nullable();
            $table->string('status', 50)->default('APPROVED');
            $table->timestamps();
        });

        // 16. Templates
        Schema::create('product_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->foreignId('brand_id')->nullable()->constrained('brands')->onDelete('set null');
            $table->string('product_type', 50)->default('SIMPLE');
            $table->json('default_attributes')->nullable();
            $table->json('default_pricing')->nullable();
            $table->timestamps();
        });

        // 17. Audit Logs & Price History
        Schema::create('product_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action', 100);
            $table->string('field_name', 100)->nullable();
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->string('ip_address', 50)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('product_price_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('price_type', 50)->default('RETAIL');
            $table->decimal('old_price', 19, 4);
            $table->decimal('new_price', 19, 4);
            $table->string('change_reason', 255)->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_price_history');
        Schema::dropIfExists('product_audit_logs');
        Schema::dropIfExists('product_templates');
        Schema::dropIfExists('product_reviews');
        Schema::dropIfExists('product_qc_inspections');
        Schema::dropIfExists('product_warranties');
        Schema::dropIfExists('product_serial_numbers');
        Schema::dropIfExists('product_batches');
        Schema::dropIfExists('product_boms');
        Schema::dropIfExists('product_bundles');
        Schema::dropIfExists('product_suppliers');
        Schema::dropIfExists('product_warehouse_locations');
        Schema::dropIfExists('product_price_rules');
        Schema::dropIfExists('unit_conversions');
        Schema::dropIfExists('product_attribute_values');
        Schema::dropIfExists('product_attributes');
        Schema::dropIfExists('product_variants');
    }
};
