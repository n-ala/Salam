const http = require('http');
const fs = require('fs');
const path = require('path');

// Global database memory context (Fiber Broadband domain)
const db = {
    users: [
        {
            user_id: 'USR-1001',
            name: 'Fahad Al-Otaibi',
            phone: '0501234567',
            email: 'fahad.otaibi@example.com',
            address: 'King Fahd Road, Building 402, Apt 12',
            city: 'Riyadh',
            created_at: '2026-01-15T09:30:00.000Z',
            contracts: [
                {
                    contract_id: 'CTR-8801',
                    brand_id: 'STC_FIBER',
                    category: 'FIBER_BROADBAND',
                    contract_type: '500 Mbps FTTH Plan',
                    fiber_plate_number: '12340003',
                    status: 'Active',
                    start_date: '2026-01-01',
                    end_date: '2027-01-01'
                }
            ]
        },
        {
            user_id: 'USR-1002',
            name: 'Sarah Mansour',
            phone: '0559876543',
            email: 'sarah.m@example.com',
            address: 'Olaya District, Villa 88',
            city: 'Riyadh',
            created_at: '2026-02-10T14:20:00.000Z',
            contracts: [
                {
                    contract_id: 'CTR-8802',
                    brand_id: 'MOBILY_FIBER',
                    category: 'FIBER_BROADBAND',
                    contract_type: '1000 Mbps Fiber Ultra',
                    fiber_plate_number: '12340002',
                    status: 'Active',
                    start_date: '2025-06-01',
                    end_date: '2027-06-01'
                }
            ]
        }
    ],
    technician_slots: [
        {
            slot_id: 'SLT-2001',
            technician_id: 'TECH-101',
            technician_name: 'Tariq Ahmad',
            brand_id: 'STC_FIBER',
            category: 'FIBER_INSTALLATION',
            location: 'Riyadh',
            date: '2026-07-27',
            time_slot: '09:00 AM - 11:00 AM',
            is_available: true
        },
        {
            slot_id: 'SLT-2002',
            technician_id: 'TECH-101',
            technician_name: 'Tariq Ahmad',
            brand_id: 'STC_FIBER',
            category: 'FIBER_INSTALLATION',
            location: 'Riyadh',
            date: '2026-07-27',
            time_slot: '02:00 PM - 04:00 PM',
            is_available: true
        },
        {
            slot_id: 'SLT-2003',
            technician_id: 'TECH-102',
            technician_name: 'Khalid Mohammad',
            brand_id: 'MOBILY_FIBER',
            category: 'FIBER_INSTALLATION',
            location: 'Riyadh',
            date: '2026-07-28',
            time_slot: '10:00 AM - 12:00 PM',
            is_available: false
        }
    ],
    appointments: [
        {
            appointment_id: 5001,
            user_id: 'USR-1002',
            slot_id: 'SLT-2003',
            technician_id: 'TECH-102',
            technician_name: 'Khalid Ahmad',
            visit_date: '2026-07-28',
            time_slot: '10:00 AM - 12:00 PM',
            service_type: 'FTTH ONT Box Installation & Router Setup',
            status: 'Scheduled',
            notes: 'Drop cable pull from FAT box on outer wall into living room',
            created_at: '2026-07-25T11:00:00.000Z'
        }
    ],
    technician_tracking: [
        {
            appointment_id: 5001,
            technician_id: 'TECH-102',
            technician_name: 'Khalid Ahmad',
            status: 'On The Way',
            estimated_arrival: '15-20 mins',
            current_latitude: 24.7136,
            current_longitude: 46.6753,
            last_updated: '2026-07-26T14:00:00.000Z'
        }
    ]
};

// Data persistence files mapping
const FILES = {
    users: 'users.json',
    technician_slots: 'technician_slots.json',
    appointments: 'appointments.json',
    technician_tracking: 'technician_tracking.json'
};

/**
 * Bootstrap database from local JSON files or initialize default fiber seed data
 */
function bootstrapDatabase() {
    try {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        for (const [key, fileName] of Object.entries(FILES)) {
            const filePath = path.join(dataDir, fileName);
            if (fs.existsSync(filePath)) {
                try {
                    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    db[key] = Array.isArray(parsed) ? parsed : (parsed[key] || []);
                } catch (err) {
                    console.error(`⚠️ Error parsing ${fileName}, keeping seed memory:`, err.message);
                }
            } else {
                fs.writeFileSync(filePath, JSON.stringify(db[key], null, 2), 'utf8');
            }
        }

        console.log('✅ Fiber Installation Service Database Complete.');
        console.log('🚀 Active Endpoints:');
        console.log('  - [GET]  /api/users?phone=... OR /api/users?user_id=...');
        console.log('  - [POST] /api/users');
        console.log('  - [GET]  /api/available_slots?brand_id=...&category=...&location=...');
        console.log('  - [POST] /api/slots');
        console.log('  - [POST] /api/schedule_visit');
        console.log('  - [GET]  /api/appointments (?user_id=... &status=...)');
        console.log('  - [PUT]  /api/appointments (or /api/modify_appointment)');
        console.log('  - [GET]  /api/appointment_status?appointment_id=...');
        console.log('  - [GET]  /api/track_technician?appointment_id=... OR ?technician_id=...\n');
    } catch (error) {
        console.error('❌ Critical error during bootstrap:', error.message);
        process.exit(1);
    }
}

// Run loader
bootstrapDatabase();

/**
 * Helper to parse incoming HTTP JSON bodies
 */
function collectRequestBody(req) {
    return new Promise((resolve, reject) => {
        let buffer = '';
        req.on('data', chunk => { buffer += chunk.toString(); });
        req.on('end', () => resolve(buffer));
        req.on('error', err => reject(err));
    });
}

/**
 * Helper to persist state back to disk
 */
function saveCollectionToDisk(key) {
    try {
        const dataDir = path.join(__dirname, 'data');
        const filePath = path.join(dataDir, FILES[key]);
        fs.writeFileSync(filePath, JSON.stringify(db[key], null, 2), 'utf8');
        console.log(`💾 Saved updates for [${key}] to disk.`);
    } catch (error) {
        console.error(`❌ Failed to write updates for ${key}:`, error.message);
    }
}

/**
 * Phone normalization helper
 */
function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/[\s+]/g, '');
    if (cleaned.startsWith('00')) cleaned = cleaned.substring(2);
    return cleaned.toLowerCase().trim();
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let pathname = reqUrl.pathname.toLowerCase();
    
    if (pathname.endsWith('/') && pathname !== '/') {
        pathname = pathname.slice(0, -1);
    }
    
    const method = req.method;
    const searchParams = reqUrl.searchParams;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    try {
        // -------------------------------------------------------------
        // 1. GET USER
        // -------------------------------------------------------------
        if (pathname === '/api/users' && method === 'GET') {
            const phoneParam = searchParams.get('phone') || searchParams.get('phonenumber');
            const userIdParam = searchParams.get('user_id') || searchParams.get('id');

            if (!phoneParam && !userIdParam) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Please provide either user_id or phone parameter.' }));
            }

            let user = null;
            if (userIdParam) {
                user = db.users.find(u => String(u.user_id).toLowerCase() === userIdParam.toLowerCase().trim());
            } else if (phoneParam) {
                const targetPhone = normalizePhone(phoneParam);
                user = db.users.find(u => normalizePhone(u.phone || u.phonenumber) === targetPhone);
            }

            if (!user) {
                res.statusCode = 404;
                return res.end(JSON.stringify({ error: 'User profile not found.' }));
            }

            if (!Array.isArray(user.contracts)) {
                user.contracts = [];
            }

            res.statusCode = 200;
            return res.end(JSON.stringify(user));
        }

        // -------------------------------------------------------------
        // 2. NEW USER
        // -------------------------------------------------------------
        if (pathname === '/api/users' && method === 'POST') {
            const rawBody = await collectRequestBody(req);
            if (!rawBody || !rawBody.trim()) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Request body cannot be empty.' }));
            }

            const payload = JSON.parse(rawBody);
            if (!payload.name || !(payload.phone || payload.phonenumber)) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Missing required user fields: name and phone.' }));
            }

            const reqPhone = normalizePhone(payload.phone || payload.phonenumber);
            const exists = db.users.some(u => normalizePhone(u.phone || u.phonenumber) === reqPhone);

            if (exists) {
                res.statusCode = 409;
                return res.end(JSON.stringify({ error: 'A user with this phone number already exists.' }));
            }

            let maxId = 1000;
            db.users.forEach(u => {
                if (u.user_id && String(u.user_id).startsWith('USR-')) {
                    const num = parseInt(String(u.user_id).replace('USR-', ''), 10);
                    if (!isNaN(num) && num > maxId) maxId = num;
                }
            });

            const newUser = {
                user_id: `USR-${maxId + 1}`,
                name: payload.name,
                phone: payload.phone || payload.phonenumber,
                email: payload.email || '',
                address: payload.address || '',
                city: payload.city || '',
                created_at: new Date().toISOString(),
                contracts: Array.isArray(payload.contracts) ? payload.contracts : []
            };

            db.users.push(newUser);
            saveCollectionToDisk('users');

            res.statusCode = 201;
            return res.end(JSON.stringify(newUser));
        }

        // -------------------------------------------------------------
        // 3. GET AVAILABLE SLOTS
        // -------------------------------------------------------------
        if (pathname === '/api/available_slots' && method === 'GET') {
            const filterBrand = searchParams.get('brand_id');
            const filterCategory = searchParams.get('category') || searchParams.get('category_id');
            const filterLocation = searchParams.get('location') || searchParams.get('location_id');

            let matchedSlots = db.technician_slots.filter(slot => slot.is_available !== false);

            if (filterBrand) {
                matchedSlots = matchedSlots.filter(s => String(s.brand_id).toUpperCase() === filterBrand.toUpperCase());
            }
            if (filterCategory) {
                matchedSlots = matchedSlots.filter(s => String(s.category || s.category_id).toUpperCase() === filterCategory.toUpperCase());
            }
            if (filterLocation) {
                matchedSlots = matchedSlots.filter(s => String(s.location || s.location_id).toLowerCase().trim() === filterLocation.toLowerCase().trim());
            }

            res.statusCode = 200;
            return res.end(JSON.stringify(matchedSlots));
        }

        // -------------------------------------------------------------
        // 4. ADD NEW SLOT
        // -------------------------------------------------------------
        if ((pathname === '/api/slots' || pathname === '/api/technician_slots') && method === 'POST') {
            const rawBody = await collectRequestBody(req);
            if (!rawBody || !rawBody.trim()) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Request body cannot be empty.' }));
            }

            const payload = JSON.parse(rawBody);

            const requiredFields = ['technician_id', 'brand_id', 'category', 'location', 'date', 'time_slot'];
            const missing = requiredFields.filter(field => !payload[field]);

            if (missing.length > 0) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: `Missing required slot fields: ${missing.join(', ')}` }));
            }

            let maxSlotId = 2000;
            db.technician_slots.forEach(s => {
                if (s.slot_id && String(s.slot_id).startsWith('SLT-')) {
                    const num = parseInt(String(s.slot_id).replace('SLT-', ''), 10);
                    if (!isNaN(num) && num > maxSlotId) maxSlotId = num;
                }
            });

            const newSlot = {
                slot_id: `SLT-${maxSlotId + 1}`,
                technician_id: payload.technician_id,
                technician_name: payload.technician_name || 'Field Technician',
                brand_id: payload.brand_id,
                category: payload.category,
                location: payload.location,
                date: payload.date,
                time_slot: payload.time_slot,
                is_available: payload.is_available !== undefined ? payload.is_available : true
            };

            db.technician_slots.push(newSlot);
            saveCollectionToDisk('technician_slots');

            res.statusCode = 201;
            return res.end(JSON.stringify(newSlot));
        }

        // -------------------------------------------------------------
        // 5. SCHEDULE VISIT
        // -------------------------------------------------------------
        if (pathname === '/api/schedule_visit' && method === 'POST') {
            const rawBody = await collectRequestBody(req);
            if (!rawBody || !rawBody.trim()) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Payload body string cannot be empty.' }));
            }

            const payload = JSON.parse(rawBody);

            if (!payload.user_id || !payload.slot_id) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Missing required fields: user_id and slot_id.' }));
            }

            const user = db.users.find(u => String(u.user_id).toLowerCase() === String(payload.user_id).toLowerCase());
            if (!user) {
                res.statusCode = 404;
                return res.end(JSON.stringify({ error: 'User does not exist.' }));
            }

            const slotIndex = db.technician_slots.findIndex(s => String(s.slot_id).toLowerCase() === String(payload.slot_id).toLowerCase());
            if (slotIndex === -1) {
                res.statusCode = 404;
                return res.end(JSON.stringify({ error: 'Target slot_id not found.' }));
            }

            const slot = db.technician_slots[slotIndex];
            if (slot.is_available === false) {
                res.statusCode = 409;
                return res.end(JSON.stringify({ error: 'Selected slot is no longer available.' }));
            }

            let maxAppId = 5000;
            db.appointments.forEach(a => {
                if (a.appointment_id !== undefined && a.appointment_id !== null) {
                    const rawVal = String(a.appointment_id).replace(/^APT-?/i, '');
                    const num = parseInt(rawVal, 10);
                    if (!isNaN(num) && num > maxAppId) maxAppId = num;
                }
            });

            const newAppointment = {
                appointment_id: maxAppId + 1,
                user_id: payload.user_id,
                slot_id: payload.slot_id,
                technician_id: slot.technician_id || 'TECH-101',
                technician_name: slot.technician_name || 'Fiber Installation Field Tech',
                visit_date: slot.date || payload.visit_date,
                time_slot: slot.time_slot || payload.time_slot,
                service_type: payload.service_type || 'FTTH Fiber Installation & Activation',
                status: 'Scheduled',
                notes: payload.notes || '',
                created_at: new Date().toISOString()
            };

            db.technician_slots[slotIndex].is_available = false;
            saveCollectionToDisk('technician_slots');

            db.appointments.push(newAppointment);
            saveCollectionToDisk('appointments');

            res.statusCode = 201;
            return res.end(JSON.stringify(newAppointment));
        }

        // -------------------------------------------------------------
        // 6. GET ALL APPOINTMENTS
        // -------------------------------------------------------------
        if (pathname === '/api/appointments' && method === 'GET') {
            const filterUser = searchParams.get('user_id');
            const filterStatus = searchParams.get('status');

            let results = db.appointments;

            if (filterUser) {
                results = results.filter(a => String(a.user_id).toLowerCase() === filterUser.toLowerCase().trim());
            }

            if (filterStatus) {
                results = results.filter(a => String(a.status).toLowerCase() === filterStatus.toLowerCase().trim());
            }

            res.statusCode = 200;
            return res.end(JSON.stringify(results));
        }

        // -------------------------------------------------------------
        // 7. MODIFY APPOINTMENT (PUT /api/appointments or /api/modify_appointment)
        // -------------------------------------------------------------
        if ((pathname === '/api/appointments' || pathname === '/api/modify_appointment') && (method === 'PUT' || method === 'POST')) {
            const rawBody = await collectRequestBody(req);
            if (!rawBody || !rawBody.trim()) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Request body cannot be empty.' }));
            }

            const payload = JSON.parse(rawBody);
            const targetAppId = payload.appointment_id || payload.id;

            if (!targetAppId) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Missing required field: appointment_id.' }));
            }

            const appIndex = db.appointments.findIndex(a => String(a.appointment_id).toLowerCase() === String(targetAppId).toLowerCase().trim());
            if (appIndex === -1) {
                res.statusCode = 404;
                return res.end(JSON.stringify({ error: 'Appointment not found.' }));
            }

            const currentApp = db.appointments[appIndex];

            // If rescheduling to a new slot
            if (payload.slot_id && String(payload.slot_id).toLowerCase() !== String(currentApp.slot_id).toLowerCase()) {
                const newSlotIndex = db.technician_slots.findIndex(s => String(s.slot_id).toLowerCase() === String(payload.slot_id).toLowerCase());
                
                if (newSlotIndex === -1) {
                    res.statusCode = 404;
                    return res.end(JSON.stringify({ error: 'Target new slot_id not found.' }));
                }

                const newSlot = db.technician_slots[newSlotIndex];
                if (newSlot.is_available === false) {
                    res.statusCode = 409;
                    return res.end(JSON.stringify({ error: 'Target new slot is no longer available.' }));
                }

                // Free up the old slot
                const oldSlotIndex = db.technician_slots.findIndex(s => String(s.slot_id).toLowerCase() === String(currentApp.slot_id).toLowerCase());
                if (oldSlotIndex !== -1) {
                    db.technician_slots[oldSlotIndex].is_available = true;
                }

                // Reserve the new slot
                db.technician_slots[newSlotIndex].is_available = false;
                saveCollectionToDisk('technician_slots');

                // Update appointment slot attributes
                currentApp.slot_id = newSlot.slot_id;
                currentApp.technician_id = newSlot.technician_id || currentApp.technician_id;
                currentApp.technician_name = newSlot.technician_name || currentApp.technician_name;
                currentApp.visit_date = newSlot.date || currentApp.visit_date;
                currentApp.time_slot = newSlot.time_slot || currentApp.time_slot;
            }

            // Update optional fields if provided
            if (payload.status) currentApp.status = payload.status;
            if (payload.service_type) currentApp.service_type = payload.service_type;
            if (payload.notes !== undefined) currentApp.notes = payload.notes;
            if (payload.visit_date && !payload.slot_id) currentApp.visit_date = payload.visit_date;
            if (payload.time_slot && !payload.slot_id) currentApp.time_slot = payload.time_slot;

            currentApp.updated_at = new Date().toISOString();

            db.appointments[appIndex] = currentApp;
            saveCollectionToDisk('appointments');

            res.statusCode = 200;
            return res.end(JSON.stringify(currentApp));
        }

        // -------------------------------------------------------------
        // 8. APPOINTMENT STATUS
        // -------------------------------------------------------------
        if (pathname === '/api/appointment_status' && method === 'GET') {
            const appointmentId = searchParams.get('appointment_id') || searchParams.get('id');
            const userId = searchParams.get('user_id');

            if (!appointmentId && !userId) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Please provide either appointment_id or user_id.' }));
            }

            if (appointmentId) {
                const appointment = db.appointments.find(a => String(a.appointment_id).toLowerCase() === appointmentId.toLowerCase().trim());
                if (!appointment) {
                    res.statusCode = 404;
                    return res.end(JSON.stringify({ error: 'Appointment not found.' }));
                }
                res.statusCode = 200;
                return res.end(JSON.stringify(appointment));
            } else {
                const userAppointments = db.appointments.filter(a => String(a.user_id).toLowerCase() === userId.toLowerCase().trim());
                res.statusCode = 200;
                return res.end(JSON.stringify(userAppointments));
            }
        }

        // -------------------------------------------------------------
        // 9. TRACK TECHNICIAN
        // -------------------------------------------------------------
        if (pathname === '/api/track_technician' && method === 'GET') {
            const appointmentId = searchParams.get('appointment_id');
            const technicianId = searchParams.get('technician_id');

            if (!appointmentId && !technicianId) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Please supply appointment_id or technician_id parameter.' }));
            }

            let trackingData = null;

            if (appointmentId) {
                const appointment = db.appointments.find(a => String(a.appointment_id).toLowerCase() === appointmentId.toLowerCase().trim());
                if (appointment) {
                    trackingData = db.technician_tracking.find(t => 
                        String(t.appointment_id).toLowerCase() === appointmentId.toLowerCase().trim() ||
                        String(t.technician_id).toLowerCase() === String(appointment.technician_id).toLowerCase()
                    );

                    if (!trackingData) {
                        trackingData = {
                            appointment_id: appointment.appointment_id,
                            technician_id: appointment.technician_id,
                            technician_name: appointment.technician_name,
                            status: appointment.status === 'Scheduled' ? 'En Route to Installation Site' : appointment.status,
                            estimated_arrival: '15-20 mins',
                            current_latitude: 24.7136,
                            current_longitude: 46.6753,
                            last_updated: new Date().toISOString()
                        };
                    }
                }
            } else if (technicianId) {
                trackingData = db.technician_tracking.find(t => String(t.technician_id).toLowerCase() === technicianId.toLowerCase().trim());
            }

            if (!trackingData) {
                res.statusCode = 404;
                return res.end(JSON.stringify({ error: 'Technician tracking information not found.' }));
            }

            res.statusCode = 200;
            return res.end(JSON.stringify(trackingData));
        }

        res.statusCode = 404;
        return res.end(JSON.stringify({ error: `Route '${pathname}' not found.` }));

    } catch (error) {
        console.error('Server error during processing:', error);
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
    }
});

// Start Server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
