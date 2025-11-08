"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Book = {
    id: string;
    title: string;
    publishedYear: number | null;
    genre: string | null;
    pages: number | null;
};

type AuthorWithBooks = {
    id: string;
    name: string;
    email: string;
    bio: string | null;
    nationality: string | null;
    birthYear: number | null;
    books: Book[];
};

type AuthorStats = {
    totalBooks: number;
    firstBook: { title: string; year: number | null } | null;
    latestBook: { title: string; year: number | null } | null;
    averagePages: number;
    genres: string[];
    longestBook: { title: string; pages: number | null } | null;
    shortestBook: { title: string; pages: number | null } | null;
};

export default function AuthorDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [author, setAuthor] = useState<AuthorWithBooks | null>(null);
    const [stats, setStats] = useState<AuthorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                const [authorResponse, statsResponse] = await Promise.all([
                    fetch(`/api/authors/${id}`),
                    fetch(`/api/authors/${id}/stats`),
                ]);

                if (!authorResponse.ok || !statsResponse.ok) {
                    throw new Error('Error al obtener los datos del autor');
                }

                const authorData = await authorResponse.json();
                const statsData = await statsResponse.json();

                setAuthor(authorData);
                setStats(statsData);
                setError(null);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <p className="text-center mt-8">Cargando detalles del autor...</p>;
    if (error) return <p className="text-center mt-8 text-red-500">Error: {error}</p>;
    if (!author) return <p className="text-center mt-8">Autor no encontrado.</p>;

    return (
        <div className="container mx-auto p-4">
            <div className="mb-6">
                <Link href="/" className="text-blue-500 hover:underline">&larr; Volver al Dashboard</Link>
            </div>

            {/* Sección de Detalles del Autor */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h1 className="text-4xl font-bold text-black">{author.name}</h1>
                <p className="text-lg text-gray-600">{author.email}</p>
                {author.bio && <p className="mt-4 text-gray-700">{author.bio}</p>}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-800">
                    {author.nationality && <div><strong>Nacionalidad:</strong> {author.nationality}</div>}
                    {author.birthYear && <div><strong>Año de Nacimiento:</strong> {author.birthYear}</div>}
                </div>
            </div>

            {/* Sección de Estadísticas */}
            {stats && (
                <div className="bg-gray-50 shadow rounded-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-black">Estadísticas</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-gray-800">
                        <div className="text-center"><div className="text-3xl font-bold">{stats.totalBooks}</div><div>Libros Publicados</div></div>
                        <div className="text-center"><div className="text-3xl font-bold">{stats.averagePages}</div><div>Páginas Promedio</div></div>
                        <div className="text-center"><div className="font-bold">Géneros</div><div>{stats.genres.join(', ') || 'N/A'}</div></div>
                        {stats.firstBook && <div className="text-center"><div className="font-bold">Primer Libro</div><div>{stats.firstBook.title} ({stats.firstBook.year})</div></div>}
                        {stats.latestBook && <div className="text-center"><div className="font-bold">Último Libro</div><div>{stats.latestBook.title} ({stats.latestBook.year})</div></div>}
                        {stats.longestBook && <div className="text-center"><div className="font-bold">Libro más largo</div><div>{stats.longestBook.title} ({stats.longestBook.pages} pág.)</div></div>}
                    </div>
                </div>
            )}

            {/* Sección de Libros */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Libros de este Autor</h2>
                {author.books.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {author.books.map(book => (
                            <div key={book.id} className="border rounded-lg p-4 shadow-sm">
                                <h3 className="text-lg font-semibold">{book.title}</h3>
                                {book.publishedYear && <p className="text-sm text-gray-300">Año: {book.publishedYear}</p>}
                                {book.genre && <p className="text-sm text-gray-400">Género: {book.genre}</p>}
                                {book.pages && <p className="text-sm text-gray-500">{book.pages} páginas</p>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Este autor aún no tiene libros registrados.</p>
                )}
            </div>
        </div>
    );
}