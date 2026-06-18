import { useEffect, useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import { jobService } from '../../services/api'
import HomeCategoriesSection from './sections/HomeCategoriesSection'
import HomeFeaturedJobsSection from './sections/HomeFeaturedJobsSection'
import HomeHowItWorksSection from './sections/HomeHowItWorksSection'
import HomeHeroSection from './sections/HomeHeroSection'
import HomeTestimonialsSection from './sections/HomeTestimonialsSection'
import HomeTopCompaniesSection from './sections/HomeTopCompaniesSection'

const formatStat = (value, fallback) => {
  const numericValue = Number(value)
  if (!numericValue) return fallback
  return numericValue.toLocaleString('en-IN')
}

const HomePage = () => {
  const [jobs, setJobs] = useState([])
  const [categories, setCategories] = useState([])
  const [employers, setEmployers] = useState([])
  const [homeStats, setHomeStats] = useState(null)
  const [searchForm, setSearchForm] = useState({ title: '', location: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true)
        const [jobsResponse, categoriesResponse, statsResponse, employersResponse] = await Promise.all([
          jobService.getFeaturedJobs({ limit: 6 }),
          jobService.getPopularCategories(),
          jobService.getStats(),
          jobService.getEmployers({ limit: 8 }),
        ])
        setJobs(jobsResponse.data.jobs || [])
        setCategories(categoriesResponse.data.categories || [])
        setHomeStats(statsResponse.data.stats || null)
        setEmployers(employersResponse.data.employers || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch home data')
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  const heroStats = {
    liveJobs: formatStat(homeStats?.liveJobs, '0'),
    companies: formatStat(homeStats?.companies, '0'),
    candidates: formatStat(homeStats?.candidates, '0'),
    newJobs: formatStat(homeStats?.newJobs, '0'),
  }

  return (
    <MainLayout fullBleed>
      <HomeHeroSection
        searchForm={searchForm}
        setSearchForm={setSearchForm}
        stats={heroStats}
      />
      <HomeHowItWorksSection />
      <HomeCategoriesSection categories={categories} />
      <HomeFeaturedJobsSection jobs={jobs} loading={loading} error={error} />
      <HomeTopCompaniesSection employers={employers} />
      <HomeTestimonialsSection />
    </MainLayout>
  )
}

export default HomePage
