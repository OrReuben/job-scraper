/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { styled } from "styled-components";
import axios from "axios";
import JobCard from "./JobCard";
import Pagination from "./Pagination";
import Spinner from "./Spinner";
import { useSearchParams } from "react-router-dom";

const AllJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const uri = "http://localhost:5000"
  const countRef = useRef(0);
  const [searchParams] = useSearchParams();
  const { website, role, page } = Object.fromEntries([...searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [website, role]);

  useEffect(() => {
    let ignore = false;
    const fetchJobs = async () => {
      setIsLoading(true);
      if (!website && !role) {
        const { data: fetchedJobs } = await axios.get(
          `${uri}/jobs?page=${currentPage}`
        );
        if (!ignore) {
          setJobs(fetchedJobs.jobs);
          countRef.current = fetchedJobs.count;
          setPageCount(Math.ceil(fetchedJobs.count / 10));
          setIsLoading(false);
        }
      } else {
        const { data: fetchedJobs } = await axios.get(
          `${uri}/jobs?website=${website || ""}&any=${
            role || ""
          }&page=${currentPage}`
        );
        if (!ignore) {
          setJobs(fetchedJobs.jobs);
          countRef.current = fetchedJobs.count;
          setPageCount(Math.ceil(fetchedJobs.count / 10));
          setIsLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      ignore = true;
    };
  }, [uri, currentPage, website, role]);

  useEffect(() => {
    if (page) {
      setCurrentPage(Number(page));
    } else {
      setCurrentPage(1);
    }
  }, [page]);
  
  return (
    <Container>
      <h1> נמצאו {countRef.current} עבודות עבורך:</h1>
      {isLoading ? (
        <Spinner />
      ) : (
        <section>
          {jobs.length === 0 ? (
            <h2>לא מצאנו עבודות לחיפוש שלך...</h2>
          ) : (
            jobs.map((job) => <JobCard job={job} key={job._id} />)
          )}
        </section>
      )}

      <Pagination
        uri={uri}
        isLoading={isLoading}
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
        pageCount={pageCount}
      />
    </Container>
  );
};

export default AllJobs;

const Container = styled.section`
  max-width: 1200px;
  margin: auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  section {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;

    @media (max-width: 1300px) {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
  }
`;
