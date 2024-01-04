// /* eslint-disable no-console */
// import { genId } from './helpers';
// import { ITenant } from '../src/modules/types';
// import { tenants } from './modules/tenant';

// export async function TenantActions() {
//   if (process.env.MANAGE_TENANTS === 'true') {
//     const newTenant: ITenant = {
//       // db_name: 'TEST',
//       fqdn: `${genId()}.com`,
//       force_https: true,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       redirect_to: 'test.com',
//     };

//     const newTenant2: ITenant = {
//       db_name: genId(),
//       fqdn: `${genId()}.com`,
//       force_https: true,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       redirect_to: 'google.com',
//     };

//     let tenantID = '';

//     console.log('Creating tenant...');
//     tenantID = await tenants.createTenant(newTenant);

//     console.log(`Updating tenant ${tenantID}`);
//     newTenant.db_name = genId();
//     await tenants.updateTenant(tenantID, newTenant);

//     console.log('Creating second tenant...');
//     tenantID = await tenants.createTenant(newTenant2);

//     console.log('Deleting second tenant...');
//     await tenants.deleteTenant(tenantID);
//   }
// }

// void TenantActions();

const greeting = 'world';

export function hello(world: string = greeting): string {
  // eslint-disable-next-line no-console
  console.log(`Hello ${world}!`);
  return `Hello ${world}!`;
}

hello(); // Hello world!
