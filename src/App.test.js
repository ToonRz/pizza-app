import { render, screen } from '@testing-library/react';
import App from './App';

test('renders pizza order section', () => {
  render(<App />);
  const linkElement = screen.getByText(/Delicious Pizza Delivered to Your Doorstep/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders our pizzas section', () => {
  render(<App />);
  // ตรวจสอบว่ามีคำว่า "Our Pizzas" หรือไม่
  const pizzasElement = screen.getByText(/Pizza Menu/i);
  expect(pizzasElement).toBeInTheDocument();
});
