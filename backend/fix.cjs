const fs = require('fs');
const files = [
  'd:/tastifyy/backend/src/routes/admin.routes.ts',
  'd:/tastifyy/backend/src/routes/customer.routes.ts',
  'd:/tastifyy/backend/src/routes/delivery.routes.ts'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/req\.user!\.id/g, '(req.user as any).id');
  content = content.replace(/deleteFile\('restaurant-assets', /g, 'deleteFile(');
  content = content.replace(/uploadFile\('restaurant-assets', 'users', path, /g, "uploadFile('users', (req.user as any).id, filename, ");
  content = content.replace(/uploadFile\('restaurant-assets', 'delivery', path, /g, "uploadFile('delivery', partner.id, filename, ");
  fs.writeFileSync(file, content);
});
