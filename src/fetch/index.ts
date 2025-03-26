import { message } from "ant-design-vue";

export interface Res<T> {
    code: number;
    data: T;
    message: string;
}

export interface Page<T> {
  pageNum: number
  pageSize: number
  total: number
  list: T[]
}

const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
};

async function fetchData(url: string, options: any = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const finalOptions = { ...defaultOptions, ...options };
  try {
    if (options.method === 'GET' && options.params) {
        url += '?' + new URLSearchParams(options.params).toString();
    }
    const response = await fetch(`${baseUrl}${url}`, finalOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const res = await response.json();
    if (res.code !== 200) {
      message.error(res.message)
      res.code === -100 && (location.href = location.href)
    }
    return res;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export default fetchData;
