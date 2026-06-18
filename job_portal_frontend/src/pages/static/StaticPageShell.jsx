import MainLayout from '../../layouts/MainLayout'

const StaticPageShell = ({ title, crumb = title, children, footer = true }) => {
  return (
    <MainLayout fullBleed hideFooter={!footer}>
      {title && (
        <section className="border-b border-[#E4E5E8] bg-[#F1F2F4] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 text-sm">
            <h1 className="font-semibold text-[#18191C]">{title}</h1>
            <p className="text-xs text-[#767F8C]">
              Home / <span className="text-[#18191C]">{crumb}</span>
            </p>
          </div>
        </section>
      )}
      {children}
    </MainLayout>
  )
}

export default StaticPageShell
