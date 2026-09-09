<?php

namespace App\Modules\Invoice\Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\Invoice\Persistence\Models\InvoiceTemplate;
use App\Modules\Invoice\Persistence\Models\InvoiceTemplateVersion;
use App\Modules\Invoice\Persistence\Models\InvoiceSequence;

class InvoiceTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // ========================================================
        // 1. GDT Official Cambodia Tax Invoice (A4)
        // ========================================================
        $gdtA4 = InvoiceTemplate::updateOrCreate(
            ['code' => 'tpl-kh-gdt-tax-a4'],
            [
                'name' => 'Official Cambodia GDT Tax Invoice (វិក្កយបត្រពន្ធ)',
                'document_type' => 'TAX_INVOICE',
                'paper_size' => 'A4',
                'orientation' => 'PORTRAIT',
                'is_default' => true,
                'is_active' => true,
                'description' => 'Meets General Department of Taxation (GDT) requirements with National Emblem, bilingual Khmer/English headers, VATTIN, and dual currency USD/KHR.',
                'layout_config' => [
                    'show_national_header' => true,
                    'national_header_text_kh' => 'ព្រះរាជាណាចក្រកម្ពុជា',
                    'national_header_sub_kh' => 'ជាតិ សាសនា ព្រះមហាក្សត្រ',
                    'show_logo' => true,
                    'logo_url' => '/assets/logo.png',
                    'logo_height_px' => 50,
                    'company_name_kh' => 'ក្រុមហ៊ុន ស្មាតភីអូអេស សឹលូសិន ខូអិលធីឌី',
                    'company_name_en' => 'SmartPOS Solutions (Cambodia) Co., Ltd.',
                    'vattin' => 'K001-902100888',
                    'company_address_kh' => 'អគារ ៨៨ មហាវិថីព្រះមុនីវង្ស សង្កាត់បឹងរាំង ខណ្ឌដូនពេញ រាជធានីភ្នំពេញ',
                    'company_address_en' => 'Building 88 Preah Monivong Blvd, Phnom Penh, Cambodia',
                    'company_phone' => '+855 (0) 23 888 999',
                    'company_email' => 'billing@smartpos.com.kh',
                    'company_website' => 'https://smartpos.com.kh',
                    'show_customer_info' => true,
                    'show_customer_vattin' => true,
                    'show_doc_meta' => true,
                    'doc_title_kh' => 'វិក្កយបត្រពន្ធ',
                    'doc_title_en' => 'TAX INVOICE',
                    'table_columns' => [
                        ['id' => 'num', 'label_kh' => 'ល.រ', 'label_en' => 'No', 'visible' => true, 'width' => '6%'],
                        ['id' => 'name', 'label_kh' => 'បរិយាយទំនិញ / សេវាកម្ម', 'label_en' => 'Description of Goods/Services', 'visible' => true, 'width' => '40%'],
                        ['id' => 'qty', 'label_kh' => 'បរិមាណ', 'label_en' => 'Qty', 'visible' => true, 'width' => '10%'],
                        ['id' => 'price', 'label_kh' => 'ថ្លៃឯកតា', 'label_en' => 'Unit Price', 'visible' => true, 'width' => '14%'],
                        ['id' => 'discount', 'label_kh' => 'បញ្ចុះតម្លៃ', 'label_en' => 'Discount', 'visible' => true, 'width' => '12%'],
                        ['id' => 'total', 'label_kh' => 'ថ្លៃទំនិញ', 'label_en' => 'Amount', 'visible' => true, 'width' => '18%'],
                    ],
                    'show_vat_breakdown' => true,
                    'vat_rate_percent' => 10,
                    'show_dual_currency' => true,
                    'exchange_rate' => 4100,
                    'show_signatures' => true,
                    'signatures' => [
                        ['role' => 'buyer', 'label_kh' => 'ហត្ថលេខា និងឈ្មោះអ្នកទិញ', 'label_en' => 'Customer Signature & Name'],
                        ['role' => 'seller', 'label_kh' => 'ហត្ថលេខា និងឈ្មោះអ្នកលក់', 'label_en' => 'Seller Signature & Name'],
                    ],
                    'show_payment_qr' => true,
                    'qr_type' => 'KHQR',
                    'notes' => 'ទំនិញដែលបានទិញរួចមិនអាចប្តូរជាសាច់ប្រាក់វិញបានទេ។ សូមអរគុណ!',
                ],
                'styles_config' => [
                    'primary_color' => '#059669', // Emerald
                    'accent_color' => '#047857',
                    'font_family' => 'Battambang, sans-serif',
                    'font_size_scale' => 'sm',
                    'border_style' => 'solid',
                    'header_bg' => '#f0fdf4',
                    'margin_mm' => 12,
                ],
            ]
        );

        InvoiceTemplateVersion::updateOrCreate(
            ['template_id' => $gdtA4->id, 'version_number' => 1],
            [
                'change_summary' => 'Standard Cambodia GDT Compliant A4',
                'layout_config' => $gdtA4->layout_config,
                'styles_config' => $gdtA4->styles_config,
                'created_by' => 1,
            ]
        );

        // ========================================================
        // 2. High-Speed POS Thermal Receipt (80mm)
        // ========================================================
        $pos80 = InvoiceTemplate::updateOrCreate(
            ['code' => 'tpl-pos-thermal-80mm'],
            [
                'name' => 'High-Speed POS Thermal Receipt (80mm)',
                'document_type' => 'POS_RECEIPT',
                'paper_size' => 'THERMAL_80MM',
                'orientation' => 'PORTRAIT',
                'is_default' => true,
                'is_active' => true,
                'description' => 'Standard 80mm thermal receipt printer roll with Bakong KHQR dynamic checkout, cashier ID, and return policy notice.',
                'layout_config' => [
                    'show_national_header' => false,
                    'show_logo' => true,
                    'logo_url' => '/assets/logo.png',
                    'logo_height_px' => 38,
                    'company_name_kh' => 'ស្មាតភីអូអេស ម៉ាត',
                    'company_name_en' => 'SmartPOS Express Mart',
                    'company_address_en' => 'Branch #01 - Preah Monivong Blvd, Phnom Penh',
                    'company_phone' => '+855 (0) 23 888 999',
                    'show_customer_info' => true,
                    'show_doc_meta' => true,
                    'doc_title_kh' => 'បង្កាន់ដៃទូទាត់ប្រាក់',
                    'doc_title_en' => 'SALES RECEIPT',
                    'table_columns' => [
                        ['id' => 'name', 'label_kh' => 'ទំនិញ', 'label_en' => 'Item', 'visible' => true, 'width' => '50%'],
                        ['id' => 'qty', 'label_kh' => 'ចំនួន', 'label_en' => 'Qty', 'visible' => true, 'width' => '18%'],
                        ['id' => 'price', 'label_kh' => 'តម្លៃ', 'label_en' => 'Price', 'visible' => true, 'width' => '32%'],
                    ],
                    'show_vat_breakdown' => true,
                    'vat_rate_percent' => 10,
                    'show_dual_currency' => true,
                    'exchange_rate' => 4100,
                    'show_payment_qr' => true,
                    'qr_type' => 'KHQR',
                    'show_barcode' => true,
                    'barcode_field' => 'invoice_number',
                    'show_signatures' => false,
                    'notes' => 'សូមអរគុណ! សូមពិនិត្យទំនិញ និងប្រាក់អាប់មុនចាកចេញ។ (Thank you! Please check items & change before leaving).',
                ],
                'styles_config' => [
                    'primary_color' => '#111827', // Crisp POS black
                    'accent_color' => '#374151',
                    'font_family' => 'monospace, "Courier New"',
                    'font_size_scale' => 'xs',
                    'border_style' => 'dashed',
                    'header_bg' => '#ffffff',
                    'margin_mm' => 3,
                ],
            ]
        );

        InvoiceTemplateVersion::updateOrCreate(
            ['template_id' => $pos80->id, 'version_number' => 1],
            [
                'change_summary' => 'Standard 80mm POS Thermal Receipt',
                'layout_config' => $pos80->layout_config,
                'styles_config' => $pos80->styles_config,
                'created_by' => 1,
            ]
        );

        // ========================================================
        // 3. Mini POS Thermal Slip (58mm)
        // ========================================================
        InvoiceTemplate::updateOrCreate(
            ['code' => 'tpl-pos-thermal-58mm'],
            [
                'name' => 'Compact Mobile POS Receipt (58mm)',
                'document_type' => 'POS_RECEIPT',
                'paper_size' => 'THERMAL_58MM',
                'orientation' => 'PORTRAIT',
                'is_default' => false,
                'is_active' => true,
                'description' => 'Narrow 58mm roll format for handheld Bluetooth POS terminals and delivery riders.',
                'layout_config' => [
                    'show_national_header' => false,
                    'show_logo' => false,
                    'company_name_en' => 'SmartPOS Mobile',
                    'company_phone' => '+855 23 888 999',
                    'show_customer_info' => false,
                    'show_doc_meta' => true,
                    'doc_title_kh' => 'វិក្កយបត្រសង្ខេប',
                    'doc_title_en' => 'MINI RECEIPT',
                    'table_columns' => [
                        ['id' => 'name', 'label_kh' => 'មុខទំនិញ', 'label_en' => 'Item', 'visible' => true, 'width' => '60%'],
                        ['id' => 'total', 'label_kh' => 'សរុប', 'label_en' => 'Tot', 'visible' => true, 'width' => '40%'],
                    ],
                    'show_vat_breakdown' => false,
                    'show_dual_currency' => true,
                    'exchange_rate' => 4100,
                    'show_payment_qr' => true,
                    'qr_type' => 'KHQR',
                    'show_barcode' => false,
                    'show_signatures' => false,
                    'notes' => 'Thank you for your visit!',
                ],
                'styles_config' => [
                    'primary_color' => '#000000',
                    'accent_color' => '#000000',
                    'font_family' => 'monospace',
                    'font_size_scale' => 'xs',
                    'border_style' => 'dotted',
                    'header_bg' => '#ffffff',
                    'margin_mm' => 1,
                ],
            ]
        );

        // ========================================================
        // 4. Warehouse Dispatch & Delivery Note (A5)
        // ========================================================
        InvoiceTemplate::updateOrCreate(
            ['code' => 'tpl-logistics-delivery-a5'],
            [
                'name' => 'Warehouse Dispatch & Delivery Note (A5)',
                'document_type' => 'DELIVERY_NOTE',
                'paper_size' => 'A5',
                'orientation' => 'LANDSCAPE',
                'is_default' => true,
                'is_active' => true,
                'description' => 'Logistics manifest with driver signoff, recipient check boxes, recipient phone, and warehouse dispatch stamp.',
                'layout_config' => [
                    'show_national_header' => false,
                    'show_logo' => true,
                    'logo_url' => '/assets/logo.png',
                    'logo_height_px' => 40,
                    'company_name_kh' => 'ស្មាតភីអូអេស ឡូជីស្ទីក',
                    'company_name_en' => 'SmartPOS Express Logistics',
                    'company_phone' => '+855 (0) 99 555 111',
                    'show_customer_info' => true,
                    'show_doc_meta' => true,
                    'doc_title_kh' => 'ប័ណ្ណដឹកជញ្ជូនទំនិញ',
                    'doc_title_en' => 'DELIVERY SLIP / PACKING LIST',
                    'table_columns' => [
                        ['id' => 'num', 'label_kh' => 'ល.រ', 'label_en' => '#', 'visible' => true, 'width' => '8%'],
                        ['id' => 'sku', 'label_kh' => 'កូដ', 'label_en' => 'SKU', 'visible' => true, 'width' => '20%'],
                        ['id' => 'name', 'label_kh' => 'ទំនិញ', 'label_en' => 'Description', 'visible' => true, 'width' => '47%'],
                        ['id' => 'qty', 'label_kh' => 'ចំនួន', 'label_en' => 'Qty', 'visible' => true, 'width' => '15%'],
                        ['id' => 'check', 'label_kh' => 'ពិនិត្យ', 'label_en' => 'Check', 'visible' => true, 'width' => '10%'],
                    ],
                    'show_vat_breakdown' => false,
                    'show_dual_currency' => false,
                    'show_payment_qr' => false,
                    'show_signatures' => true,
                    'signatures' => [
                        ['role' => 'driver', 'label_kh' => 'អ្នកដឹកជញ្ជូន (Driver)', 'label_en' => 'Dispatched By'],
                        ['role' => 'recipient', 'label_kh' => 'អ្នកទទួលទំនិញ (Recipient)', 'label_en' => 'Received In Good Order'],
                    ],
                    'notes' => 'Please inspect all parcels prior to signing. Claims must be submitted within 24 hours.',
                ],
                'styles_config' => [
                    'primary_color' => '#2563eb', // Blue
                    'accent_color' => '#1d4ed8',
                    'font_family' => 'Battambang, sans-serif',
                    'font_size_scale' => 'sm',
                    'border_style' => 'solid',
                    'header_bg' => '#eff6ff',
                    'margin_mm' => 10,
                ],
            ]
        );

        // ========================================================
        // 5. Commercial B2B Quotation / Price Estimate (A4)
        // ========================================================
        InvoiceTemplate::updateOrCreate(
            ['code' => 'tpl-b2b-quotation-a4'],
            [
                'name' => 'Commercial B2B Quotation & Estimate (A4)',
                'document_type' => 'QUOTATION',
                'paper_size' => 'A4',
                'orientation' => 'PORTRAIT',
                'is_default' => true,
                'is_active' => true,
                'description' => 'Formal sales proposal with validity period, payment terms, and deposit conditions.',
                'layout_config' => [
                    'show_national_header' => false,
                    'show_logo' => true,
                    'logo_url' => '/assets/logo.png',
                    'logo_height_px' => 45,
                    'company_name_kh' => 'ក្រុមហ៊ុន ស្មាតភីអូអេស សឹលូសិន ខូអិលធីឌី',
                    'company_name_en' => 'SmartPOS Solutions (Cambodia) Co., Ltd.',
                    'vattin' => 'K001-902100888',
                    'company_address_en' => 'Preah Monivong Blvd, Phnom Penh, Cambodia',
                    'company_phone' => '+855 (0) 23 888 999',
                    'company_email' => 'sales@smartpos.com.kh',
                    'show_customer_info' => true,
                    'show_doc_meta' => true,
                    'doc_title_kh' => 'តារាងតម្លៃទំនិញ / សេវាកម្ម',
                    'doc_title_en' => 'COMMERCIAL QUOTATION',
                    'table_columns' => [
                        ['id' => 'num', 'label_kh' => 'ល.រ', 'label_en' => 'Item', 'visible' => true, 'width' => '8%'],
                        ['id' => 'name', 'label_kh' => 'មុខទំនិញ / លក្ខណៈបច្ចេកទេស', 'label_en' => 'Item & Specifications', 'visible' => true, 'width' => '42%'],
                        ['id' => 'qty', 'label_kh' => 'ចំនួន', 'label_en' => 'Qty', 'visible' => true, 'width' => '12%'],
                        ['id' => 'price', 'label_kh' => 'តម្លៃឯកតា', 'label_en' => 'Unit Rate', 'visible' => true, 'width' => '18%'],
                        ['id' => 'total', 'label_kh' => 'សរុប ($)', 'label_en' => 'Total ($)', 'visible' => true, 'width' => '20%'],
                    ],
                    'show_vat_breakdown' => true,
                    'vat_rate_percent' => 10,
                    'show_dual_currency' => true,
                    'exchange_rate' => 4100,
                    'show_signatures' => true,
                    'signatures' => [
                        ['role' => 'prepared_by', 'label_kh' => 'រៀបចំដោយ (Prepared By)', 'label_en' => 'Sales Consultant'],
                        ['role' => 'approved_by', 'label_kh' => 'យល់ព្រមដោយ (Approved By)', 'label_en' => 'Managing Director'],
                    ],
                    'notes' => '1. This quotation is valid for 30 days from issue date.\n2. 50% deposit required upon confirmation.\n3. Delivery within 3 business days of deposit.',
                ],
                'styles_config' => [
                    'primary_color' => '#7c3aed', // Purple
                    'accent_color' => '#6d28d9',
                    'font_family' => 'Battambang, sans-serif',
                    'font_size_scale' => 'sm',
                    'border_style' => 'solid',
                    'header_bg' => '#faf5ff',
                    'margin_mm' => 12,
                ],
            ]
        );

        // ========================================================
        // 6. Numbering Sequences
        // ========================================================
        $sequences = [
            [
                'name' => 'GDT Tax Invoices Sequence',
                'document_type' => 'TAX_INVOICE',
                'pattern' => 'INV-{YYYY}-{####}',
                'prefix' => 'INV-',
                'current_number' => 120,
                'padding' => 4,
                'reset_frequency' => 'YEARLY',
                'is_active' => true,
            ],
            [
                'name' => 'POS Express Receipts Sequence',
                'document_type' => 'POS_RECEIPT',
                'pattern' => 'POS-{YYYYMM}-{#####}',
                'prefix' => 'POS-',
                'current_number' => 840,
                'padding' => 5,
                'reset_frequency' => 'MONTHLY',
                'is_active' => true,
            ],
            [
                'name' => 'Logistics Dispatch Delivery Notes',
                'document_type' => 'DELIVERY_NOTE',
                'pattern' => 'DLV-{YYYY}-{####}',
                'prefix' => 'DLV-',
                'current_number' => 45,
                'padding' => 4,
                'reset_frequency' => 'YEARLY',
                'is_active' => true,
            ],
            [
                'name' => 'Commercial Quotations Sequence',
                'document_type' => 'QUOTATION',
                'pattern' => 'QUO-{YYYY}-{####}',
                'prefix' => 'QUO-',
                'current_number' => 32,
                'padding' => 4,
                'reset_frequency' => 'YEARLY',
                'is_active' => true,
            ],
        ];

        foreach ($sequences as $seq) {
            InvoiceSequence::updateOrCreate(
                ['document_type' => $seq['document_type']],
                $seq
            );
        }
    }
}
