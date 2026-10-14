import prisma from "../lib/prisma.js";


type CreateAuditLogParams = {
  tenantId: string;
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: object;
  ipAddress?: string;
  userAgent?: string;
};

export const createAuditLog = async ({
  tenantId,
  userId,
  action,
  entity,
  entityId,
  metadata,
  ipAddress,
  userAgent,
}: CreateAuditLogParams) => {
  return prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action,
      entity,
      entityId,
      metadata,
      ipAddress,
      userAgent,
    },
  });
};