export interface ITenant {
    id?: string;
    fqdn: string;
    createdAt: Date;
    updatedAt: Date;
    redirect_to: string;
    force_https: boolean;
    db_name?: string;
    deletedAt?: Date | null;
    under_maintenance_since?: Date | null;
}