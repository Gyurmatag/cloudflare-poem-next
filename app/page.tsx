import { getRequestContext } from "@cloudflare/next-on-pages";
import { marked } from 'marked';

export const runtime = 'edge';

interface PoemResponse {
    id: string;
    text: string;
    createdDate: string;
    imgBucketName: string;
}

export default async function Home() {
    const response = await fetch("https://cloudflare-poem.gyurmatag.workers.dev/current-weather-poem");
    const responseData = await response.json() as PoemResponse;

    const pic = await getRequestContext().env.BUCKET.get(responseData.imgBucketName);
    const timeToGenerate = await getRequestContext().env.KV.get(responseData.id.toString());

    let imageSrc: string | undefined;

    if (pic) {
        const imageArrayBuffer = await pic.arrayBuffer();
        const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64');
        imageSrc = `data:image/jpeg;base64,${imageBase64}`;
    }

    const formattedText = marked(responseData.text);

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6 space-y-4">
                {imageSrc ? (
                    <div className="w-full">
                        <img src={imageSrc} alt="Cloudflare Bucket Image" className="w-full h-48 object-cover rounded-lg shadow" />
                    </div>
                ) : (
                    <div className="w-full h-48 bg-gray-300 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Image not found</p>
                    </div>
                )}

                <div className="text-center space-y-2">
                    <div
                        className="prose prose-sm text-gray-800"
                        dangerouslySetInnerHTML={{ __html: formattedText }}
                    ></div>
                    <p className="text-sm text-gray-600 mt-2">- {responseData.createdDate}</p>

                    {timeToGenerate && (
                        <p className="text-xs text-gray-500 mt-2">
                            <span className="font-semibold">Generation Time:</span> {timeToGenerate} ms
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
