"use client";


import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

type Book = {
    id: string; title: string; description: string | null; isbn: string | null;
    genre: string | null; publishedYear: number | null; pages: number | null;
    authorId: string;
    author: { name: string; };
};
type PaginationInfo = {
    page: number; limit: number; total: number; totalPages: number;
    hasNext: boolean; hasPrev: boolean;
};
type AuthorListItem = {
    id: string;
    name: string;
};

type BooksClientPageProps = {
    initialBooks: Book[];
    initialPagination: PaginationInfo;
    genres: string[];
    authorList: AuthorListItem[];
};

const initialBookState = {
    id: '', title: '', description: '', isbn: '',
    publishedYear: '', genre: '', pages: '', authorId: '',
};

export default function BooksClientPage({
    initialBooks,
    initialPagination,
    genres,
    authorList
}: BooksClientPageProps) {

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [books, setBooks] = useState(initialBooks);
    const [paginationInfo, setPaginationInfo] = useState(initialPagination);

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        genre: searchParams.get('genre') || '',
        authorId: searchParams.get('authorId') || '',
        sortBy: searchParams.get('sortBy') || 'createdAt',
        order: searchParams.get('order') || 'desc',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(initialBookState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setBooks(initialBooks);
        setPaginationInfo(initialPagination);
    }, [initialBooks, initialPagination]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        updateURL(newFilters, 1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= (paginationInfo?.totalPages || 1)) {
            updateURL(filters, newPage);
        }
    };

    const updateURL = (currentFilters: typeof filters, newPage: number) => {
        const params = new URLSearchParams(searchParams);
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        params.set('page', String(newPage));
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateClick = () => {
        setIsEditing(false);
        setFormData(initialBookState);
        setIsModalOpen(true);
    };

    const handleEditClick = (book: Book) => {
        setIsEditing(true);
        setFormData({
            id: book.id,
            title: book.title,
            description: book.description || '',
            isbn: book.isbn || '',
            publishedYear: book.publishedYear?.toString() || '',
            genre: book.genre || '',
            pages: book.pages?.toString() || '',
            authorId: book.authorId,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.authorId) {
            alert("El título y el autor son campos obligatorios.");
            return;
        }
        setIsSubmitting(true);

        try {
            const url = isEditing ? `/api/books/${formData.id}` : '/api/books';
            const method = isEditing ? 'PUT' : 'POST';
            const body = JSON.stringify({
                ...formData,
                publishedYear: formData.publishedYear ? Number(formData.publishedYear) : null,
                pages: formData.pages ? Number(formData.pages) : null,
            });

            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error al ${isEditing ? 'actualizar' : 'crear'} el libro`);
            }

            setIsModalOpen(false);
            alert(`¡Libro ${isEditing ? 'actualizado' : 'creado'} con éxito!`);

            router.refresh();

        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (bookId: string) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este libro? Esta acción no se puede deshacer.")) {
            return;
        }

        try {
            const response = await fetch(`/api/books/${bookId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar el libro');
            }

            alert('¡Libro eliminado con éxito!');
            router.refresh();

        } catch (err: any) {
            console.error(err);
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Búsqueda de Libros</h1>
            <div className="bg-gray-800 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                <input type="text" name="search" placeholder="Buscar por título..." value={filters.search} onChange={handleFilterChange} className="p-2 rounded bg-gray-700 text-white" />
                <select name="authorId" value={filters.authorId} onChange={handleFilterChange} className="p-2 rounded bg-gray-700 text-white">
                    <option value="">Todos los autores</option>
                    {authorList.map(author => (<option key={author.id} value={author.id}>{author.name}</option>))}
                </select>
                <select name="genre" value={filters.genre} onChange={handleFilterChange} className="p-2 rounded bg-gray-700 text-white">
                    <option value="">Todos los géneros</option>
                    {genres.map(genre => (<option key={genre} value={genre}>{genre}</option>))}
                </select>
                <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="p-2 rounded bg-gray-700 text-white">
                    <option value="createdAt">Más nuevos</option>
                    <option value="title">Título</option>
                    <option value="publishedYear">Año Publicación</option>
                </select>

                <div className="flex flex-col md:flex-row gap-2 lg:col-span-2">
                    <button onClick={handleCreateClick} className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Crear Libro
                    </button>
                    <Link href="/" className="flex-1 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center">
                        Ir a Autores
                    </Link>
                </div>
            </div>

            <>
                <div className="mb-4">
                    <p className="text-gray-100">Mostrando <strong>{books.length}</strong> de <strong>{paginationInfo?.total || 0}</strong> resultados.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {books.length > 0 ? (
                        books.map((book) => (
                            <div key={book.id} className="border border-gray-700 rounded-lg p-4 shadow-sm bg-gray-800">
                                <h2 className="text-xl font-semibold text-white">{book.title}</h2>
                                <p className="text-gray-400">por {book.author.name}</p>
                                <div className="mt-2 text-sm">
                                    {book.genre && <span className="mr-2 inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-full">{book.genre}</span>}
                                    {book.publishedYear && <span className="text-gray-500">{book.publishedYear}</span>}
                                </div>
                                <div className="mt-4 space-x-2">
                                    <button onClick={() => handleEditClick(book)} className="text-sm bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded">Editar</button>
                                    <button
                                        onClick={() => handleDelete(book.id)}
                                        className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Eliminar</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-white col-span-full text-center">No se encontraron libros.</p>
                    )}
                </div>
                {paginationInfo && paginationInfo.totalPages > 1 && (
                    <div className="mt-6 flex justify-center items-center space-x-2">
                        <button onClick={() => handlePageChange(paginationInfo.page - 1)} disabled={!paginationInfo.hasPrev} className="px-4 py-2 bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
                        <span className="text-white">Página {paginationInfo.page} de {paginationInfo.totalPages}</span>
                        <button onClick={() => handlePageChange(paginationInfo.page + 1)} disabled={!paginationInfo.hasNext} className="px-4 py-2 bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
                    </div>
                )}
            </>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4 text-white">{isEditing ? 'Editar Libro' : 'Crear Nuevo Libro'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-gray-300">Título*</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleModalInputChange} className="w-full p-2 border rounded bg-gray-700 text-white border-gray-600" required />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-300">Autor*</label>
                                    <select name="authorId" value={formData.authorId} onChange={handleModalInputChange} className="w-full p-2 border rounded bg-gray-700 text-white border-gray-600" required>
                                        <option value="">Seleccione un autor</option>
                                        {authorList.map(author => (
                                            <option key={author.id} value={author.id}>{author.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-300">Género</label>
                                    <input type="text" name="genre" value={formData.genre} onChange={handleModalInputChange} className="w-full p-2 border rounded bg-gray-700 text-white border-gray-600" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-300">ISBN</label>
                                    <input type="text" name="isbn" value={formData.isbn} onChange={handleModalInputChange} className="w-full p-2 border rounded bg-gray-700 text-white border-gray-600" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-300">Año de Publicación</label>
                                    <input type="number" name="publishedYear" value={formData.publishedYear} onChange={handleModalInputChange} className="w-full p-2 border rounded bg-gray-700 text-white border-gray-600" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-300">Páginas</label>
                                    <input type="number" name="pages" value={formData.pages} onChange={handleModalInputChange} className="w-full p-2 border rounded bg-gray-700 text-white border-gray-600" />
                                </div>
                                <div className="md:col-span-2 mb-4">
                                    <label className="block text-gray-300">Descripción</label>
                                    <textarea name="description" value={formData.description} onChange={handleModalInputChange} className="w-full p-2 border rounded bg-gray-700 text-white border-gray-600" rows={3}></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
                                    {isSubmitting ? (isEditing ? 'Actualizando...' : 'Guardando...') : (isEditing ? 'Actualizar' : 'Guardar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}