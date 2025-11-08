import BooksClientPage from './BooksClientPage';

type BooksPageProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function fetchBooksData(searchParams: { [key: string]: string | string[] | undefined }) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const validKeys = ['page', 'limit', 'sortBy', 'order', 'search', 'genre', 'authorId'];

    const cleanParams: { [key: string]: string } = {};

    validKeys.forEach(key => {
        if (searchParams[key]) {
            cleanParams[key] = String(searchParams[key]);
        }
    });

    const params = new URLSearchParams(cleanParams);

    if (!params.has('page')) params.set('page', '1');
    if (!params.has('limit')) params.set('limit', '9');
    if (!params.has('sortBy')) params.set('sortBy', 'createdAt');
    if (!params.has('order')) params.set('order', 'desc');

    const [booksRes, genresRes, authorsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/books/search?${params.toString()}`, { cache: 'no-store' }),
        fetch(`${apiBaseUrl}/api/books/genres`, { cache: 'no-store' }),
        fetch(`${apiBaseUrl}/api/authors/list`, { cache: 'no-store' }),
    ]);

    if (!booksRes.ok || !genresRes.ok || !authorsRes.ok) {
        throw new Error('Error al obtener los datos de la página de libros');
    }

    const booksData = await booksRes.json();
    const genresData = await genresRes.json();
    const authorsData = await authorsRes.json();

    return {
        initialBooks: booksData.data,
        initialPagination: booksData.pagination,
        genres: genresData,
        authorList: authorsData,
    };
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
    // Await searchParams antes de usarlo
    const resolvedSearchParams = await searchParams;
    
    const { initialBooks, initialPagination, genres, authorList } = await fetchBooksData(resolvedSearchParams);

    return (
        <BooksClientPage
            initialBooks={initialBooks}
            initialPagination={initialPagination}
            genres={genres}
            authorList={authorList}
        />
    );
}