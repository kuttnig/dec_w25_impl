import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function App() {
  const productListQuery = useQuery({
    queryKey: ['productListQuery'],
    queryFn: async () => {
      const response = await axios.post('http://localhost:5172/products/List', {});
      return response.data;
    },
  });

  let queryMsg = '';
  if (productListQuery.isPending) {
    queryMsg = 'fetching data';
  } else if (productListQuery.isError) {
    queryMsg = 'failed to fetch data';
  } else {
    queryMsg = JSON.stringify(productListQuery.data);
  }

  // todo: render product list
  return <p>{queryMsg}</p>;
}
