import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(
    request: Request,
    context: RouteContext
) {
    try {
        const { id } = await context.params;

        const author = await prisma.author.findUnique({
            where: { id: id },
        });

        if (!author) {
            return NextResponse.json(
                { error: 'Autor no encontrado' },
                { status: 404 }
            );
        }

        const books = await prisma.book.findMany({
            where: { authorId: id },
            orderBy: {
                publishedYear: 'desc',
            },
        });

        return NextResponse.json({
            author: {
                id: author.id,
                name: author.name,
            },
            totalBooks: books.length,
            books,
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Error al obtener libros del autor' },
            { status: 500 }
        );
    }
}