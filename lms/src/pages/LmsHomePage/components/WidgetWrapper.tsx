import {PropsWithChildren} from "react";

const WidgetWrapper = ({children}: PropsWithChildren) => {
  return (
    <div className="relative w-full h-full overflow-auto">
      {children}
    </div>
  );
}

export default WidgetWrapper;
