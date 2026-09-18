import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { prisma } from '../utils/prisma.js';
import type { Request, Response } from 'express';

const router = Router();

router.use(authenticate);

// POST /api/ai/recommend
router.post('/recommend', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Prompt is required' } });
  }

  try {
    // Keep intent extraction deterministic and local; recommendations still come from live DB data.
    let maxPrice = 9999;
    let isVeg = null;
    let keywords: string[] = [];

    const lowerPrompt = prompt.toLowerCase();
    
    // Extract price (e.g. "under 200", "< 300", "budget 500")
    const priceMatch = lowerPrompt.match(/(?:under|below|<|budget)\s*₹?\s*(\d+)/);
    if (priceMatch && priceMatch[1]) {
      maxPrice = parseInt(priceMatch[1], 10);
    }

    // Extract dietary
    if (/(?:veg|vegetarian|शाकाहारी|शाकाहार)/i.test(lowerPrompt) && !/(?:non-veg|chicken|meat|मांस|चिकन)/i.test(lowerPrompt)) {
      isVeg = true;
    } else if (/(?:non-veg|chicken|meat|biryani|मांस|चिकन|बिरयानी)/i.test(lowerPrompt)) {
      isVeg = false;
    }

    // Extract keywords
    const commonWords = ['i', 'want', 'something', 'to', 'eat', 'under', 'below', 'rupees', 'rs', 'veg', 'vegetarian', 'non-veg', 'a', 'an', 'the', 'some', 'food', 'show', 'best', 'please'];
    keywords = lowerPrompt.split(/\s+/)
      .filter((w: string) => !commonWords.includes(w) && isNaN(Number(w)))
      .map((w: string) => w.replace(/[^a-z]/g, ''));

    // 2. Query DB based on extracted intent
    const whereClause: any = {
      is_available: true,
      price: { lte: maxPrice },
      restaurant: {
        approval_status: 'approved',
        account_status: 'active',
        visibility_status: 'visible',
      },
    };
    
    if (isVeg !== null) {
      whereClause.is_veg = isVeg;
    }

    if (keywords.length > 0) {
      whereClause.OR = [
        ...keywords.map((k: string) => ({ name: { contains: k, mode: 'insensitive' } })),
        ...keywords.map((k: string) => ({ description: { contains: k, mode: 'insensitive' } }))
      ];
    }

    const recommendations = await prisma.menuItem.findMany({
      where: whereClause,
      take: 5,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            city: true,
            is_open: true,
            logo_url: true,
            cover_image_url: true,
            avg_preparation_time_mins: true,
            ratings: { select: { restaurant_rating: true } }
          }
        }
      }
    });

    // 3. Format AI Response
    let aiMessage = "I found some great options for you in Sakoli!";
    if (recommendations.length === 0) {
      aiMessage = "I couldn't find anything matching your exact request. Try adjusting your budget or search terms!";
    } else if (priceMatch) {
      aiMessage = `Here are some ${isVeg ? 'vegetarian ' : ''}options under ₹${maxPrice}:`;
    }

    const results = recommendations
      .filter(item => item.restaurant.is_open)
      .map(item => {
        const ratings = item.restaurant.ratings || [];
        const rating = ratings.length
          ? Number((ratings.reduce((sum, entry) => sum + entry.restaurant_rating, 0) / ratings.length).toFixed(1))
          : null;
        const { ratings: _ratings, ...restaurant } = item.restaurant;
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: Number(item.price),
          image_url: item.image_url,
          is_veg: item.is_veg,
          is_available: item.is_available,
          restaurant: { ...restaurant, rating }
        };
      });

    res.json({
      success: true,
      data: {
        message: aiMessage,
        parsedIntent: { maxPrice, isVeg, keywords },
        results
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'AI Assistant failed' } });
  }
});

export default router;
