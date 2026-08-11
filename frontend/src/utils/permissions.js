export const ROLES = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Receptionist",
};

export const routeRoles = {
  "/dashboard": [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  "/departments": [ROLES.ADMIN, ROLES.RECEPTIONIST],
  "/doctors": [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  "/patients": [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  "/appointments": [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  "/medical-records": [ROLES.ADMIN, ROLES.DOCTOR],
  "/prescriptions": [ROLES.ADMIN, ROLES.DOCTOR],
  "/medicines": [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  "/inventory": [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  "/payments": [ROLES.ADMIN, ROLES.RECEPTIONIST],
  "/billing": [ROLES.ADMIN, ROLES.RECEPTIONIST],
  "/reports": [ROLES.ADMIN],
  "/users": [ROLES.ADMIN],
  "/profile": [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  "/settings": [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  "/support": [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
};

export const actions = {
  patients: {
    create: [ROLES.ADMIN, ROLES.RECEPTIONIST],
    update: [ROLES.ADMIN, ROLES.RECEPTIONIST],
    delete: [ROLES.ADMIN],
  },
  doctors: {
    create: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },
  appointments: {
    create: [ROLES.ADMIN, ROLES.RECEPTIONIST],
    update: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
    delete: [ROLES.ADMIN],
  },
  departments: {
    create: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },
  medicalRecords: {
    create: [ROLES.ADMIN, ROLES.DOCTOR],
    update: [ROLES.ADMIN, ROLES.DOCTOR],
    delete: [ROLES.ADMIN],
  },
  prescriptions: {
    create: [ROLES.ADMIN, ROLES.DOCTOR],
    update: [ROLES.ADMIN, ROLES.DOCTOR],
    delete: [ROLES.ADMIN],
  },
  medicines: {
    create: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },
  payments: {
    create: [ROLES.ADMIN, ROLES.RECEPTIONIST],
    update: [ROLES.ADMIN, ROLES.RECEPTIONIST],
    delete: [ROLES.ADMIN],
  },
};

export function can(user, resource, action) {
  return Boolean(user?.role && actions[resource]?.[action]?.includes(user.role));
}

export function canVisit(user, path) {
  return Boolean(user?.role && routeRoles[path]?.includes(user.role));
}
