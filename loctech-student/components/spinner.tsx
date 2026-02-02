const Spinner = () => {
  return (
    <div
      aria-label="Loading"
      className="relative inline-flex flex-col gap-2 items-center justify-center"
    >
      <div className="relative flex w-8 h-8">
        <i className="absolute w-full h-full rounded-full border-3 border-b-primary animate-spinner-ease-spin border-solid border-t-transparent border-l-transparent border-r-transparent" />
        <i className="absolute w-full h-full rounded-full border-3 border-b-primary opacity-75 animate-spinner-linear-spin border-dotted border-t-transparent border-l-transparent border-r-transparent" />
      </div>
    </div>
  );
};

interface SpinnerLoaderProps {
  title: string;
  message: string;
}

export const SpinnerLoader = ({ title, message }: SpinnerLoaderProps) => {
  return (
    <div className="flex items-center justify-center">
      <div className="text-center space-y-4 animate-in fade-in duration-1000">
        <div className="relative">
          <Spinner />
          {/* <GraduationCap className="h-6 w-6 text-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" /> */}
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground animate-in slide-in-from-bottom-2 duration-700 delay-300">
            {title}
          </p>
          <p className="text-sm text-muted-foreground animate-in slide-in-from-bottom-2 duration-700 delay-500">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Spinner;
