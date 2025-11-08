import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const genre = searchParams.get('genre');

        const authorId = searchParams.get('authorId');

        const page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || '10', 10);
        if (limit > 50) limit = 50;
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const order = searchParams.get('order') || 'desc';

        const where: Prisma.BookWhereInput = {
            AND: [
                search ? { title: { contains: search, mode: 'insensitive' } } : {},
                genre ? { genre: { equals: genre } } : {},
                authorId ? { authorId: { equals: authorId } } : {},
            ],
        };

        const [total, books] = await prisma.$transaction([
            prisma.book.count({ where }),
            prisma.book.findMany({
                where,
                take: limit,
                skip: (page - 1) * limit,
                orderBy: { [sortBy]: order },
                include: {
                    author: { select: { name: true } },
                },
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            data: books,
            pagination: {
                page, limit, total, totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Error al procesar la búsqueda de libros' },
            { status: 500 }
        );
    }
}