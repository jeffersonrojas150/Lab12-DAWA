"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Author = {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  nationality?: string | null;
  birthYear?: number | null;
  _count?: {
    books: number;
  };
};

export default function HomePage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAuthor, setCurrentAuthor] = useState<Partial<Author>>({
    name: '', email: '', bio: '', nationality: '', birthYear: undefined
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/authors');
      if (!response.ok) throw new Error('Error al obtener los autores');
      const data = await response.json();
      setAuthors(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (author: Author) => {
    setIsEditing(true);
    setCurrentAuthor({ ...author, birthYear: author.birthYear || undefined });
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setIsEditing(false);
    setCurrentAuthor({ name: '', email: '', bio: '', nationality: '', birthYear: undefined });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentAuthor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAuthor.name || !currentAuthor.email) {
      alert("Nombre y Email son campos requeridos.");
      return;
    }

    const authorData = {
      ...currentAuthor,
      birthYear: currentAuthor.birthYear ? Number(currentAuthor.birthYear) : null,
    };

    const url = isEditing ? `/api/authors/${currentAuthor.id}` : '/api/authors';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al ${isEditing ? 'actualizar' : 'crear'} el autor`);
      }

      const savedAuthor = await response.json();

      if (isEditing) {
        setAuthors((prev) => prev.map(a => a.id === savedAuthor.id ? savedAuthor : a));
      } else {
        setAuthors((prev) => [savedAuthor, ...prev]);
      }

      setIsModalOpen(false);
      alert(`Autor ${isEditing ? 'actualizado' : 'creado'} con éxito!`);

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (authorId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este autor?")) return;
    try {
      await fetch(`/api/authors/${authorId}`, { method: 'DELETE' });
      setAuthors((prev) => prev.filter((author) => author.id !== authorId));
      alert("Autor eliminado correctamente");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <p className="text-center mt-8">Cargando autores...</p>;
  if (error) return <p className="text-center mt-8 text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Autores</h1>
      <div className="mb-4 flex gap-4">
        <button
          onClick={handleCreateClick}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Crear Nuevo Autor
        </button>
        <Link
          href="/books"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-block"
        >
          Ir a Libros
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors.map((author) => (
          <div key={author.id} className="border rounded-lg p-4 shadow">
            <h2 className="text-xl font-semibold">{author.name}</h2>
            <p className="text-gray-500">{author.email}</p>
            <p className="text-gray-400 mt-2">Libros publicados: {author._count?.books ?? 0}</p>
            <div className="mt-4 space-x-2">
              <Link href={`/authors/${author.id}`} className="text-sm bg-gray-200 hover:bg-gray-300 text-black px-3 py-1 rounded">Ver Detalles</Link>
              <button onClick={() => handleEditClick(author)} className="text-sm bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded">Editar</button>
              <button onClick={() => handleDelete(author.id)} className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-black">{isEditing ? 'Editar Autor' : 'Crear Nuevo Autor'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Nombre*</label>
                <input type="text" name="name" value={currentAuthor.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded text-cyan-950" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Email*</label>
                <input type="email" name="email" value={currentAuthor.email || ''} onChange={handleInputChange} className="w-full p-2 border rounded text-cyan-950" required />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Biografía</label>
                <input type="text" name="bio" value={currentAuthor.bio || ''} onChange={handleInputChange} className="w-full p-2 border rounded text-cyan-950" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Nacionalidad</label>
                <input type="text" name="nationality" value={currentAuthor.nationality || ''} onChange={handleInputChange} className="w-full p-2 border rounded text-cyan-950" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Año de Nacimiento</label>
                <input type="number" name="birthYear" value={currentAuthor.birthYear || ''} onChange={handleInputChange} className="w-full p-2 border rounded text-cyan-950" />
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancelar</button>
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">{isEditing ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}