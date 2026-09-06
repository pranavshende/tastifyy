import { prisma } from '../utils/prisma.js';
export const createCategory = async (req, res) => {
    const { restaurant_id, name, display_order } = req.body;
    try {
        const category = await prisma.menuCategory.create({
            data: { restaurant_id, name, display_order: display_order || 0 }
        });
        res.json(category);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const createMenuItem = async (req, res) => {
    const { restaurant_id, category_id, name, description, price, is_veg } = req.body;
    try {
        const item = await prisma.menuItem.create({
            data: { restaurant_id, category_id, name, description, price, is_veg }
        });
        res.json(item);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=menu.controller.js.map