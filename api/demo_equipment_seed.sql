USE ictrax_db;

INSERT IGNORE INTO equipment_categories (name, tag_id_mode, tag_prefix, tag_sequence, is_builtin) VALUES
('Peripheral Device', 'manual', NULL, NULL, 0),
('Network Equipment', 'manual', NULL, NULL, 0),
('Portable Computer', 'manual', NULL, NULL, 0);

INSERT IGNORE INTO equipment_locations (name, is_builtin) VALUES
('Faculty Room', 0),
('ICT Office', 0);

INSERT INTO equipment
(equipment_code, name, category, location, serial_number, status, condition_status, date_acquired, last_maintenance, notes)
VALUES
('CD-2312','Computer Set','Desktop Computer','Computer Laboratory 1','ICT-CD2312-SN001','Operational','Good','2025-01-15','2026-08-01','Demo equipment record for ICTRAX testing. QR-ready tag ID: CD-2312.'),
('CD-2313','Computer Set','Desktop Computer','Computer Laboratory 1','ICT-CD2313-SN002','Operational','Good','2025-01-15','2026-08-01','Demo equipment record for ICTRAX testing. QR-ready tag ID: CD-2313.'),
('PR-1045','Printer','Peripheral Device','Faculty Room','ICT-PR1045-SN003','Operational','Good','2024-06-10','2026-07-15','Demo equipment record for ICTRAX testing. QR-ready tag ID: PR-1045.'),
('SW-0088','Network Switch','Network Equipment','Server Room','ICT-SW0088-SN004','Under Repair','Fair','2024-03-20','2026-06-20','Demo equipment record for ICTRAX testing. QR-ready tag ID: SW-0088.'),
('LP-5566','Laptop Computer','Portable Computer','ICT Office','ICT-LP5566-SN005','Operational','Good','2025-02-05','2026-08-10','Demo equipment record for ICTRAX testing. QR-ready tag ID: LP-5566.')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category = VALUES(category),
    location = VALUES(location),
    serial_number = VALUES(serial_number),
    status = VALUES(status),
    condition_status = VALUES(condition_status),
    date_acquired = VALUES(date_acquired),
    last_maintenance = VALUES(last_maintenance),
    notes = VALUES(notes);
