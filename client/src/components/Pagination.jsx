/* eslint-disable react/prop-types */
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";

const Pagination = ({ isLoading, pageCount, currentPage, setCurrentPage }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const handleChangePage = (i) => {
    const paramsObj = Object.fromEntries([...searchParams]);
    setSearchParams({ ...paramsObj, page: i });
    setCurrentPage(i);
  };

  const generatePageNumbers = () => {
    let pageNumbers = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(pageCount, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <PageNumber
          key={i}
          onClick={() => handleChangePage(i)}
          $current={i === currentPage}
        >
          {i}
        </PageNumber>
      );
    }

    return pageNumbers;
  };

  return <Container $isLoading={isLoading}>{generatePageNumbers()}</Container>;
};

export default Pagination;

const Container = styled.div`
  display: ${({ $isLoading }) => ($isLoading ? "none" : "flex")};
  align-items: center;
  justify-content: center;
  position: sticky;
  bottom: 0px;
  background-color: white;
  padding: 10px;
`;

const PageNumber = styled.button`
  width: 30px;
  height: 30px;
  background-color: ${({ $current }) => ($current ? "#ff7100" : "white")};
  color: ${({ $current }) => ($current ? "white" : "black")};
  border: 1px solid black;
  border-radius: 50%;
  padding: 5px;
  margin: 0 5px;
  cursor: pointer;
  transition: 0.25s;

  &:hover {
    background-color: #ff730099;
  }
`;
