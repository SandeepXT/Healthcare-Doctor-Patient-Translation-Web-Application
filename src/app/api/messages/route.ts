import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { translateText } from '@/lib/openai';

// POST create new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, role, text, originalLang, targetLang, audioUrl } = body;

    // Translate the text
    let translatedText = null;
    if (originalLang !== targetLang) {
      translatedText = await translateText(text, originalLang, targetLang);
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        originalText: text,
        translatedText,
        originalLang,
        targetLang,
        audioUrl: audioUrl || null,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

// GET messages for a conversation with search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const searchQuery = searchParams.get('search');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID required' },
        { status: 400 }
      );
    }

    let whereClause: any = { conversationId };

    if (searchQuery) {
      whereClause.OR = [
        { originalText: { contains: searchQuery, mode: 'insensitive' } },
        { translatedText: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
