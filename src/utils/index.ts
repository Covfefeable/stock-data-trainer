import dayjs from "dayjs";

export const datePickerPresets = [
  {
    label: "一月前",
    value: dayjs().subtract(1, "month"),
  },
  {
    label: "三月前",
    value: dayjs().subtract(3, "month"),
  },
  {
    label: "一年前",
    value: dayjs().subtract(1, "year"),
  },
  {
    label: "五年前",
    value: dayjs().subtract(5, "year"),
  },
  {
    label: "十年前",
    value: dayjs().subtract(10, "year"),
  },
  {
    label: "全部",
    // 从 2000-01-01 开始
    value: dayjs("2000-01-01"),
  },
];

export const factorDefaultContent = `// interface Data {
//   close: number
//   date: string
//   high: number
//   low: number
//   open: number
//   ticker: string
//   volume: number
// }

// 1.必须返回新的 data 数组
// 2.新的指标约定以 "$f_" 开头
// 3.确保每一条记录都含有相同的新指标，无法计算可补0

// 代码示例：
// manipulate: (data) => {
//   const newData = data.map(item => {
//     return {
//       ...item,
//       $f_newFactor: item.high - item.low
//     }
//   })
//   return newData
// }

(() => {
  return {
    manipulate: (data) => {
      // todo
    }
  }
})()
`;
