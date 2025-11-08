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
            return NextResponse.json({ error: 'Autor no encontrado' }, { status: 404 });
        }

        const books = await prisma.book.findMany({
            where: { authorId: id },
            orderBy: { publishedYear: 'asc' },
        });

        if (books.length === 0) {
            return NextResponse.json({
                authorId: author.id,
                authorName: author.name,
                totalBooks: 0,
                firstBook: null,
                latestBook: null,
                averagePages: 0,
                genres: [],
                longestBook: null,
                shortestBook: null,
            });
        }

        const totalBooks = books.length;

        const firstBook = {
            title: books[0].title,
            year: books[0].publishedYear,
        };

        const latestBook = {
            title: books[totalBooks - 1].title,
            year: books[totalBooks - 1].publishedYear,
        };

        const booksWithPages = books.filter(book => book.pages !== null);
        const totalPages = booksWithPages.reduce((sum, book) => sum + book.pages!, 0);
        const averagePages = booksWithPages.length > 0 ? Math.round(totalPages / booksWithPages.length) : 0;

        const genres = [...new Set(books.map(book => book.genre).filter(Boolean))];

        const sortedByPages = [...booksWithPages].sort((a, b) => a.pages! - b.pages!);
        const shortestBook = sortedByPages.length > 0 ? {
            title: sortedByPages[0].title,
            pages: sortedByPages[0].pages,
        } : null;
        const longestBook = sortedByPages.length > 0 ? {
            title: sortedByPages[sortedByPages.length - 1].title,
            pages: sortedByPages[sortedByPages.length - 1].pages,
        } : null;


        return NextResponse.json({
            authorId: author.id,
            authorName: author.name,
            totalBooks,
            firstBook,
            latestBook,
            averagePages,
            genres,
            longestBook,
            shortestBook,
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Error al obtener las estadísticas del autor' },
            { status: 500 }
        );
    }
}