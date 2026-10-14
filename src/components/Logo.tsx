export default function Logo() {
  return (
    <img
      src={`${import.meta.env.BASE_URL}bay-venues-logo.png`}
      alt="Bay Venues"
      width={1697}
      height={461}
      className="mx-auto my-4 h-auto w-56 max-w-full sm:w-64"
    />
  )
}
