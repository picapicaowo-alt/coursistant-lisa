import React, {PropsWithChildren} from "react";

const WidgetWrapper: React.FC<PropsWithChildren> = (props: { children: React.ReactNode }) => {
  return (
    <div className="relative w-full h-full overflow-auto">
      {props.children}
    </div>
  );
}

export default WidgetWrapper;
