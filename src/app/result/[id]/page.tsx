interface ResultPageProps {
    params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
    const { id } = await params;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
            <h1 className="text-3xl font-bold">Ergebnis</h1>
            <p className="mt-4 text-gray-600">Result ID: {id}</p>
        </main>
    );
}
