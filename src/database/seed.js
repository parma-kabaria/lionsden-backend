import { connectDatabase, closeDatabase } from '../config/db.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { Role } from '../modules/roles/role.model.js';
import { Branch } from '../modules/branches/branch.model.js';
import { User } from '../modules/users/user.model.js';
import { Bungalow } from '../modules/bungalows/bungalow.model.js';
import { Booking } from '../modules/bookings/booking.model.js';
import { Payment } from '../modules/payments/payment.model.js';
import {
  ROLES,
  PERMISSIONS,
  BUNGALOW_CATEGORIES,
  BUNGALOW_MAINTENANCE_STATUS,
} from '../config/constants.js';

export const seedDatabase = async () => {
  logger.info('Starting idempotent database seed...');

  // 1. Seed Roles and Permissions
  const allPermissions = Object.values(PERMISSIONS);

  const adminPermissions = [
    PERMISSIONS.BRANCHES_READ,
    PERMISSIONS.BUNGALOWS_READ,
    PERMISSIONS.BUNGALOWS_CREATE,
    PERMISSIONS.BUNGALOWS_UPDATE,
    PERMISSIONS.PRICING_READ,
    PERMISSIONS.AVAILABILITY_SEARCH,
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_UPDATE,
    PERMISSIONS.BOOKINGS_CANCEL,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.NEGOTIATIONS_READ,
    PERMISSIONS.NEGOTIATIONS_APPROVE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.PAYMENTS_REVERSE,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_UPDATE,
    PERMISSIONS.MAINTENANCE_APPROVE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.AUDIT_LOGS_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
  ];

  const salesPermissions = [
    PERMISSIONS.BRANCHES_READ,
    PERMISSIONS.BUNGALOWS_READ,
    PERMISSIONS.PRICING_READ,
    PERMISSIONS.AVAILABILITY_SEARCH,
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.NEGOTIATIONS_READ,
    PERMISSIONS.NEGOTIATIONS_SUBMIT,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.DASHBOARD_READ,
  ];

  const rolesToSeed = [
    {
      code: ROLES.SUPER_ADMIN,
      name: 'Super Admin',
      description: 'Unrestricted master access across all branches, finance, and system operations',
      permissions: allPermissions,
      isSystem: true,
    },
    {
      code: ROLES.ADMIN,
      name: 'Branch Admin',
      description:
        'Authorized branch management, maintenance approval, negotiated rent decision, and branch reports',
      permissions: adminPermissions,
      isSystem: true,
    },
    {
      code: ROLES.SALES,
      name: 'Sales Executive',
      description:
        'Check availability, create bookings, register customers, record initial payments, submit discount negotiations',
      permissions: salesPermissions,
      isSystem: true,
    },
  ];

  const roleMap = new Map();
  for (const roleData of rolesToSeed) {
    const role = await Role.findOneAndUpdate(
      { code: roleData.code },
      { $set: roleData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    roleMap.set(role.code, role);
    logger.info(`Role initialized: ${role.name} (${role.code})`);
  }

  // 2. Seed Branches (Dhari Resort & Ahmedabad Corporate Head Office)
  const branchesToSeed = [
    {
      name: 'Lions Den Resort - Dhari (Gir Forest)',
      code: 'DHARI',
      type: 'RESORT',
      address: 'Gir Forest Eco Zone, Near Ambardi Safari Park',
      city: 'Dhari',
      state: 'Gujarat',
      contactPhone: '+912797234567',
      contactEmail: 'dhari@lionsdenresorts.com',
      isActive: true,
    },
    {
      name: 'Ahmedabad (Head Office / Corporate HQ)',
      code: 'AHM',
      type: 'HEAD_OFFICE',
      address: 'Sarkhej - Gandhinagar Highway, Near Vaishnodevi Circle',
      city: 'Ahmedabad',
      state: 'Gujarat',
      contactPhone: '+917923456789',
      contactEmail: 'hq@lionsdenresorts.com',
      isActive: true,
    },
  ];

  const branchMap = new Map();
  for (const branchData of branchesToSeed) {
    const branch = await Branch.findOneAndUpdate(
      { code: branchData.code },
      { $set: branchData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    branchMap.set(branch.code, branch);
    logger.info(`Branch initialized: ${branch.name} (${branch.code}) [${branch.type}]`);
  }

  // 3. Seed Initial Super Admin
  const superAdminRole = roleMap.get(ROLES.SUPER_ADMIN);
  const existingSuperAdmin = await User.findOne({ email: config.superAdmin.email });

  if (!existingSuperAdmin) {
    await User.create({
      name: config.superAdmin.name,
      email: config.superAdmin.email,
      password: config.superAdmin.password,
      phone: config.superAdmin.phone,
      role: superAdminRole._id,
      branch: null, // Super Admin has global access
      isActive: true,
    });
    logger.info(`Initial Super Admin created successfully: ${config.superAdmin.email}`);
  } else {
    logger.info(`Super Admin account already exists: ${config.superAdmin.email}`);
  }

  // 4. Seed all 80 Bungalows exclusively at the physical resort location: Dhari (Gir Forest)
  // Clean up any historical test bungalows under Ahmedabad HQ
  const ahmBranch = branchMap.get('AHM');
  const dhariBranch = branchMap.get('DHARI');

  if (ahmBranch) {
    await Bungalow.deleteMany({ branch: ahmBranch._id });
  }

  const bungalowCategoriesConfig = [
    {
      category: BUNGALOW_CATEGORIES.ONE_BHK,
      count: 20,
      codePrefix: '1',
      standardRentPaise: 400000, // INR 4,000
      capacity: { adults: 2, children: 1, maxGuests: 3 },
      facilities: ['Air Conditioning', 'Geyser', 'Smart TV', 'High-Speed Wi-Fi', 'Balcony View'],
    },
    {
      category: BUNGALOW_CATEGORIES.TWO_BHK,
      count: 25,
      codePrefix: '2',
      standardRentPaise: 650000, // INR 6,500
      capacity: { adults: 4, children: 2, maxGuests: 6 },
      facilities: [
        'Air Conditioning',
        'Geyser',
        'Smart TV',
        'High-Speed Wi-Fi',
        'Private Lawn',
        'Electric Kettle',
      ],
    },
    {
      category: BUNGALOW_CATEGORIES.THREE_BHK,
      count: 20,
      codePrefix: '3',
      standardRentPaise: 950000, // INR 9,500
      capacity: { adults: 6, children: 3, maxGuests: 9 },
      facilities: [
        'Air Conditioning',
        'Geyser',
        'Smart TV',
        'High-Speed Wi-Fi',
        'Private Lawn',
        'Plunge Pool',
        'Refrigerator',
      ],
    },
    {
      category: BUNGALOW_CATEGORIES.FOUR_BHK,
      count: 15,
      codePrefix: '4',
      standardRentPaise: 1400000, // INR 14,000
      capacity: { adults: 8, children: 4, maxGuests: 12 },
      facilities: [
        'Air Conditioning',
        'Geyser',
        'Smart TV',
        'High-Speed Wi-Fi',
        'Private Lawn',
        'Plunge Pool',
        'Refrigerator',
        'Power Backup',
      ],
    },
  ];

  let totalBungalowsSeeded = 0;
  for (const catConfig of bungalowCategoriesConfig) {
    for (let i = 1; i <= catConfig.count; i++) {
      const bungalowNumber = `B-${catConfig.codePrefix}${String(i).padStart(2, '0')}`;
      await Bungalow.findOneAndUpdate(
        { branch: dhariBranch._id, number: bungalowNumber },
        {
          $setOnInsert: {
            branch: dhariBranch._id,
            number: bungalowNumber,
            category: catConfig.category,
            standardRent: catConfig.standardRentPaise,
            capacity: catConfig.capacity,
            facilities: catConfig.facilities,
            description: `Luxurious ${catConfig.category} villa at Lions Den Resort Dhari (Gir Forest)`,
            isActive: true,
            maintenanceStatus: BUNGALOW_MAINTENANCE_STATUS.NONE,
            photos: [],
          },
        },
        { upsert: true }
      );
      totalBungalowsSeeded++;
    }
  }

  logger.info(
    `Bungalow inventory seeded successfully: ${totalBungalowsSeeded} bungalows verified at Dhari Resort.`
  );

  // 5. Seed initial bookings and collections if needed for realistic operational dashboard
  const superAdminUser = await User.findOne({ email: config.superAdmin.email });
  const sampleVillas = await Bungalow.find({ isActive: true }).limit(5);

  if (superAdminUser && sampleVillas.length >= 4) {
    const sampleBookings = [
      {
        bookingId: 'LD-2026-1',
        customer: { name: 'Ravi Patel', phone: '9876543210', email: 'ravi.patel@gmail.com' },
        branch: ahmBranch._id,
        bungalow: sampleVillas[0]._id,
        checkIn: new Date('2026-10-29T14:00:00.000Z'),
        checkOut: new Date('2026-10-31T11:00:00.000Z'),
        nights: 2,
        guests: { adults: 2, children: 1 },
        foodOption: 'WITH_FOOD',
        standardRentPerNight: 650000,
        specialRentPerNight: 650000,
        finalRentPerNight: 650000,
        totalAmount: 1600000,
        totalPaid: 1600000,
        advancePayment: 800000,
        outstandingBalance: 0,
        status: 'CONFIRMED',
        createdBy: superAdminUser._id,
      },
      {
        bookingId: 'LD-2026-2',
        customer: { name: 'Neha Sharma', phone: '9123456780', email: 'neha.s@gmail.com' },
        branch: dhariBranch._id,
        bungalow: sampleVillas[1]._id,
        checkIn: new Date('2026-10-30T14:00:00.000Z'),
        checkOut: new Date('2026-11-01T11:00:00.000Z'),
        nights: 2,
        guests: { adults: 2, children: 0 },
        foodOption: 'WITHOUT_FOOD',
        standardRentPerNight: 400000,
        specialRentPerNight: 400000,
        finalRentPerNight: 400000,
        totalAmount: 800000,
        totalPaid: 800000,
        advancePayment: 800000,
        outstandingBalance: 0,
        status: 'CONFIRMED',
        createdBy: superAdminUser._id,
      },
      {
        bookingId: 'LD-2026-3',
        customer: { name: 'Amit Desai', phone: '9876501234', email: 'amit.desai@yahoo.com' },
        branch: ahmBranch._id,
        bungalow: sampleVillas[2]._id,
        checkIn: new Date('2026-10-31T14:00:00.000Z'),
        checkOut: new Date('2026-11-02T11:00:00.000Z'),
        nights: 2,
        guests: { adults: 4, children: 2 },
        foodOption: 'WITH_FOOD',
        standardRentPerNight: 950000,
        specialRentPerNight: 950000,
        finalRentPerNight: 950000,
        totalAmount: 2300000,
        totalPaid: 1000000,
        advancePayment: 1000000,
        outstandingBalance: 1300000,
        status: 'CHECKED_IN',
        createdBy: superAdminUser._id,
      },
      {
        bookingId: 'LD-2026-4',
        customer: { name: 'Pooja Mehta', phone: '9012345678', email: 'pooja.mehta@gmail.com' },
        branch: dhariBranch._id,
        bungalow: sampleVillas[3]._id,
        checkIn: new Date('2026-11-01T14:00:00.000Z'),
        checkOut: new Date('2026-11-04T11:00:00.000Z'),
        nights: 3,
        guests: { adults: 6, children: 2 },
        foodOption: 'WITH_FOOD',
        standardRentPerNight: 1400000,
        specialRentPerNight: 1400000,
        finalRentPerNight: 1400000,
        totalAmount: 4800000,
        totalPaid: 4800000,
        advancePayment: 2000000,
        outstandingBalance: 0,
        status: 'CONFIRMED',
        createdBy: superAdminUser._id,
      },
      {
        bookingId: 'LD-2026-5',
        customer: { name: 'Rahul Singh', phone: '8736452109', email: 'rahul.s@outlook.com' },
        branch: ahmBranch._id,
        bungalow: sampleVillas[0]._id,
        checkIn: new Date('2026-11-02T14:00:00.000Z'),
        checkOut: new Date('2026-11-03T11:00:00.000Z'),
        nights: 1,
        guests: { adults: 2, children: 1 },
        foodOption: 'WITHOUT_FOOD',
        standardRentPerNight: 650000,
        specialRentPerNight: 650000,
        finalRentPerNight: 650000,
        totalAmount: 650000,
        totalPaid: 0,
        advancePayment: 0,
        outstandingBalance: 650000,
        status: 'CANCELLED',
        cancellationReason: 'Guest requested date change',
        cancelledAt: new Date('2026-10-27T12:00:00.000Z'),
        createdBy: superAdminUser._id,
      },
    ];

    for (const sb of sampleBookings) {
      await Booking.findOneAndUpdate(
        { bookingId: sb.bookingId },
        { $setOnInsert: sb },
        { upsert: true }
      );
    }

    const ahmPayments = await Payment.find({ branch: ahmBranch._id, isReversal: false });
    const ahmTotal = ahmPayments.reduce((acc, p) => acc + p.amount, 0);

    const dhariPayments = await Payment.find({ branch: dhariBranch._id, isReversal: false });
    const dhariTotal = dhariPayments.reduce((acc, p) => acc + p.amount, 0);

    const b1 = await Booking.findOne({ bookingId: 'LD-2026-1' });
    const b2 = await Booking.findOne({ bookingId: 'LD-2026-2' });

    if (ahmTotal < 24500000 && b1) {
      await Payment.create({
        receiptNumber: 'REC-AHM-' + Date.now().toString(36).toUpperCase(),
        booking: b1._id,
        branch: ahmBranch._id,
        customer: { name: 'Corporate Group Booking', phone: '9876543210' },
        amount: 24500000 - ahmTotal,
        type: 'ADVANCE',
        paymentMode: 'BANK_TRANSFER',
        collectingUser: superAdminUser._id,
        notes: 'Corporate advance collection for Ahmedabad desk',
      });
    }

    if (dhariTotal < 13200000 && b2) {
      await Payment.create({
        receiptNumber: 'REC-DHR-' + Date.now().toString(36).toUpperCase(),
        booking: b2._id,
        branch: dhariBranch._id,
        customer: { name: 'Resort Walk-in Guests', phone: '9123456780' },
        amount: 13200000 - dhariTotal,
        type: 'ADVANCE',
        paymentMode: 'UPI',
        collectingUser: superAdminUser._id,
        notes: 'On-site front desk resort collection Dhari',
      });
    }
  }

  logger.info('Database seeding completed successfully.');
};

// Direct script execution
if (process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await connectDatabase();
      await seedDatabase();
      await closeDatabase();
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Database seeding failed');
      process.exit(1);
    }
  })();
}
