import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const distinctGenres = await prisma.book.findMany({
            select: {
                genre: true,
            },
            distinct: ['genre'],
            where: {
                genre: {
                    not: null,
                },
            },
            orderBy: {
                genre: 'asc',
            }
        });

        const genres = distinctGenres.map(item => item.genre).filter(Boolean) as string[];

        return NextResponse.json(genres);

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Error al obtener los géneros' },
            { status: 500 }
        );
    }
}