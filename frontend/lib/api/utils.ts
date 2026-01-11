import axios from "axios";

type ApiCall<T> = Promise<{ data: T }>;

export async function handleRequest<T>(call: ApiCall<T>): Promise<T> {
    try {
        const response = await call;
        return response.data;
    } catch (error: any) {
        let message = "Network error. Please try again.";

        if (axios.isAxiosError(error)) {
            message =
                error.response?.data?.message ||
                error.response?.data?.detail ||
                message;
        }

        // toast.error(message);
        
        alert(message);
        throw new Error(message);
    }
}
