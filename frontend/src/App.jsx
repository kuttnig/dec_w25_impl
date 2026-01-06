import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function App() {
  const testQuery = useQuery({
    queryKey: ['testQuery'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5172/test');
      return response.data;
    },
  });

  let msg = '';
  if (testQuery.isPending) {
    msg = 'fetching data';
  } else if (testQuery.isError) {
    msg = 'failed to fetch data';
  } else {
    msg = JSON.stringify(testQuery.data);
  }

  return <p>{msg}</p>;
}
