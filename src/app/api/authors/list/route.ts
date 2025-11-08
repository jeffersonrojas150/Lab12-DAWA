import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const authors = await prisma.author.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return NextResponse.json(authors);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener la lista de autores' }, { status: 500 });
    }
}