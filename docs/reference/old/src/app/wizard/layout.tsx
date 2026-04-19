import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export default async function WizardLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const locale = await getLocale();

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    return (
        <NextIntlClientProvider messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}
