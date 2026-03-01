"use client";

import { useCallback, useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export type StudentRow = {
	name: string;
	register_no: string;
	serial_number: string;
	year: string | null;
};

const SORT_COLUMNS = ["name", "serial_number", "register_no", "year"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];
type SortOrder = "asc" | "desc";

const COLUMN_LABELS: Record<SortColumn, string> = {
	name: "Name",
	serial_number: "Serial Number",
	register_no: "Register No",
	year: "Year",
};

type ApiResponse = {
	data: StudentRow[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
};

type StudentsTableProps = {
	onAdd?: () => void;
	onEdit?: (student: StudentRow) => void;
	onDelete?: (student: StudentRow) => void;
};

export function StudentsTable({ onAdd, onEdit, onDelete }: StudentsTableProps) {
	const [data, setData] = useState<StudentRow[]>([]);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(15);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [sortBy, setSortBy] = useState<SortColumn | null>(null);
	const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
	const [loading, setLoading] = useState(true);

	const fetchStudents = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("page", String(page));
			params.set("pageSize", String(pageSize));
			if (search) params.set("search", search);
			if (sortBy) {
				params.set("sortBy", sortBy);
				params.set("sortOrder", sortOrder);
			}
			const res = await fetch(`/api/students?${params}`);
			if (!res.ok) throw new Error("Failed to fetch");
			const json: ApiResponse = await res.json();
			setData(json.data);
			setTotal(json.pagination.total);
			setTotalPages(json.pagination.totalPages);
		} catch {
			setData([]);
			setTotal(0);
			setTotalPages(0);
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, search, sortBy, sortOrder]);

	useEffect(() => {
		fetchStudents();
	}, [fetchStudents]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSearch(searchInput.trim());
		setPage(1);
	};

	const cycleSort = (column: SortColumn) => {
		if (sortBy !== column) {
			setSortBy(column);
			setSortOrder("asc");
		} else if (sortOrder === "asc") {
			setSortOrder("desc");
		} else {
			setSortBy(null);
			setSortOrder("asc");
		}
		setPage(1);
	};

	const SortHeader = ({ column }: { column: SortColumn }) => {
		const isActive = sortBy === column;
		const icon = !isActive ? (
			<ArrowUpDown className="size-4 opacity-50" />
		) : sortOrder === "asc" ? (
			<ArrowUp className="size-4" />
		) : (
			<ArrowDown className="size-4" />
		);
		return (
			<button
				type="button"
				className="flex items-center gap-1 font-medium hover:underline"
				onClick={() => cycleSort(column)}
			>
				{COLUMN_LABELS[column]}
				{icon}
			</button>
		);
	};

	return (
		<div className="w-full flex flex-col gap-4 px-4 lg:px-6">
			<div className="space-y-1">
				<h2 className="text-xl font-semibold tracking-tight">Students</h2>
				<p className="text-muted-foreground text-sm">
					View and manage student records. Search by name, serial number, or register number.
				</p>
			</div>
			<div className="flex items-center justify-between gap-4">
				<form onSubmit={handleSearchSubmit} className="flex gap-2">
					<Input
						placeholder="Search by name, serial number, register no..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="min-w-[300px] w-full max-w-md"
					/>
					<Button type="submit" variant="secondary">
						Search
					</Button>
				</form>
				<Button onClick={() => onAdd?.()} variant="default">
					<Plus className="size-4" />
					Add
				</Button>
			</div>

			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<SortHeader column="name" />
							</TableHead>
							<TableHead>
								<SortHeader column="serial_number" />
							</TableHead>
							<TableHead>
								<SortHeader column="register_no" />
							</TableHead>
							<TableHead>
								<SortHeader column="year" />
							</TableHead>
							<TableHead className="w-[100px] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center text-muted-foreground"
								>
									Loading…
								</TableCell>
							</TableRow>
						) : data.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center text-muted-foreground"
								>
									No students found.
								</TableCell>
							</TableRow>
						) : (
							data.map((student) => (
								<TableRow
									key={`${student.serial_number}-${student.register_no}`}
								>
									<TableCell className="font-medium">{student.name}</TableCell>
									<TableCell>{student.serial_number}</TableCell>
									<TableCell>{student.register_no}</TableCell>
									<TableCell>{student.year ?? "—"}</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="size-8"
												onClick={() => onEdit?.(student)}
												aria-label="Edit"
											>
												<Pencil className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="size-8 text-destructive hover:text-destructive"
												onClick={() => onDelete?.(student)}
												aria-label="Delete"
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between gap-4">
				<p className="text-muted-foreground text-sm">
					{total === 0
						? "No rows"
						: `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
				</p>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page <= 1 || loading}
						aria-label="Previous page"
					>
						<ChevronLeft className="size-4" />
					</Button>
					<span className="text-sm font-medium">
						Page {page} of {totalPages || 1}
					</span>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages || loading}
						aria-label="Next page"
					>
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
