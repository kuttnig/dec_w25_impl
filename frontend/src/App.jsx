import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function App() {
  return <ProductList />;
}

function ProductList() {
  const productListQuery = useQuery({
    queryKey: ['productListQuery'],
    queryFn: async () => {
      const response = await axios.post('http://localhost:5172/products/List', {});
      return response.data;
    },
  });

  if (productListQuery.isPending) {
    return <p>fetching product list</p>;
  } if (productListQuery.isError) {
    return <p>failed to fetch product list</p>;
  }

  const { products } = productListQuery.data;
  const productProps = Object.keys(products[0]);

  return (
    <table>
      <thead>
        <tr>
          {productProps.map((prop) => <th key={prop}>{prop}</th>)}
          <th>offers</th>
        </tr>
      </thead>
      <tbody>
        {products.map((prod) => (
          <tr key={prod.prodId}>
            {
              productProps.map((prop) => <td key={`${prod.prodId}-${prop}`}>{prod[prop]}</td>)
            }
            <td>
              <button type="button">view</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
