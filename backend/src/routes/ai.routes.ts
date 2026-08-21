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
    // 1. Mock NLP Parser
    // In a real app, we would send `prompt` to OpenAI/Gemini to extract:
    // { maxPrice: number, isVeg: boolean, keywords: string[] }
    
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
    if (lowerPrompt.includes('veg') && !lowerPrompt.includes('non-veg')) {
      isVeg = true;
    } else if (lowerPrompt.includes('non-veg') || lowerPrompt.includes('chicken') || lowerPrompt.includes('meat')) {
      isVeg = false;
    }

    // Extract keywords
    const commonWords = ['i', 'want', 'something', 'to', 'eat', 'under', 'below', 'rupees', 'rs', 'veg', 'non-veg', 'a', 'an', 'the', 'some', 'food'];
    keywords = lowerPrompt.split(/\s+/)
      .filter((w: string) => !commonWords.includes(w) && isNaN(Number(w)))
      .map((w: string) => w.replace(/[^a-z]/g, ''));

    // 2. Query DB based on extracted intent
    const whereClause: any = {
      is_available: true,
      price: { lte: maxPrice }
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
          select: { id: true, name: true, city: true, is_open: true }
        }
      }
    });

    // 3. Format AI Response
    let aiMessage = "I found some great options for you!";
    if (recommendations.length === 0) {
      aiMessage = "I couldn't find anything matching your exact request. Try adjusting your budget or search terms!";
    } else if (priceMatch) {
      aiMessage = `Here are some ${isVeg ? 'vegetarian ' : ''}options under ₹${maxPrice}:`;
    }

    res.json({
      success: true,
      data: {
        message: aiMessage,
        parsedIntent: { maxPrice, isVeg, keywords },
        results: recommendations.filter(r => r.restaurant.is_open) // Ensure restaurant is open
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'AI Assistant failed' } });
  }
});

export default router;
