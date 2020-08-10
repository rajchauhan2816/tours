const arr = [
	{ time: '0900-1000', name: 'b' },
	{ time: '1330-1430', name: 'd' },
	{ time: '0800-0900', name: 'a' },
	{ time: '1100-1200', name: 'c' }
];

arr.sort((a, b) => {
	return (a.time.split('-')[0]) - (b.time.split('-')[0]);
});

console.log(arr);


