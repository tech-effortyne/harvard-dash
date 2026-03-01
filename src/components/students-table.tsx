"use client";

import { useCallback, useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Plus,
	SquarePen,
	Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";

import {
	createStudentSchema,
	updateStudentSchema,
} from "@/app/api/students/validations";
import type {
	CreateStudentInput,
	UpdateStudentInput,
} from "@/app/api/students/validations";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
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
	id: number;
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

export function StudentsTable(_: StudentsTableProps) {
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
	const [addOpen, setAddOpen] = useState(false);
	const [addSubmitting, setAddSubmitting] = useState(false);
	const [addError, setAddError] = useState<string | null>(null);
	const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(null);
	const [deleteSubmitting, setDeleteSubmitting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [studentToEdit, setStudentToEdit] = useState<StudentRow | null>(null);
	const [editSubmitting, setEditSubmitting] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	const addForm = useForm<CreateStudentInput>({
		defaultValues: {
			name: "",
			register_no: "",
			serial_number: "",
			year: "",
		},
	});

	const editForm = useForm<CreateStudentInput>({
		defaultValues: {
			name: "",
			register_no: "",
			serial_number: "",
			year: "",
		},
	});

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

	const openAddDialog = () => {
		setAddError(null);
		addForm.reset({
			name: "",
			register_no: "",
			serial_number: "",
			year: "",
		});
		setAddOpen(true);
	};

	const openEditDialog = (student: StudentRow) => {
		setEditError(null);
		editForm.reset({
			name: student.name,
			register_no: student.register_no,
			serial_number: student.serial_number,
			year: student.year ?? "",
		});
		setStudentToEdit(student);
	};

	const handleEditSubmit = async (data: CreateStudentInput) => {
		if (!studentToEdit) return;
		const payload: UpdateStudentInput = { id: studentToEdit.id, ...data };
		const parsed = updateStudentSchema.safeParse(payload);
		if (!parsed.success) {
			parsed.error.issues.forEach((issue) => {
				const path = issue.path[0];
				if (path && typeof path === "string" && path !== "id") {
					editForm.setError(path as keyof CreateStudentInput, {
						message: issue.message,
					});
				}
			});
			return;
		}
		setEditError(null);
		setEditSubmitting(true);
		try {
			const res = await fetch("/api/students", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: parsed.data.id,
					name: parsed.data.name.trim(),
					register_no: parsed.data.register_no.trim(),
					serial_number: parsed.data.serial_number.trim(),
					year: parsed.data.year.trim(),
				}),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				setEditError(json.error ?? "Failed to update student.");
				return;
			}
			setStudentToEdit(null);
			fetchStudents();
		} catch {
			setEditError("Failed to update student.");
		} finally {
			setEditSubmitting(false);
		}
	};

	const handleDeleteClick = (student: StudentRow) => {
		setDeleteError(null);
		setStudentToDelete(student);
	};

	const handleDeleteConfirm = async () => {
		if (!studentToDelete) return;
		setDeleteError(null);
		setDeleteSubmitting(true);
		try {
			const res = await fetch("/api/students", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: studentToDelete.id }),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				setDeleteError(json.error ?? "Failed to delete student.");
				return;
			}
			setStudentToDelete(null);
			fetchStudents();
		} catch {
			setDeleteError("Failed to delete student.");
		} finally {
			setDeleteSubmitting(false);
		}
	};

	const handleAddSubmit = async (data: CreateStudentInput) => {
		const parsed = createStudentSchema.safeParse(data);
		if (!parsed.success) {
			parsed.error.issues.forEach((issue) => {
				const path = issue.path[0];
				if (path && typeof path === "string") {
					addForm.setError(path as keyof CreateStudentInput, {
						message: issue.message,
					});
				}
			});
			return;
		}
		setAddError(null);
		setAddSubmitting(true);
		try {
			const res = await fetch("/api/students", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: parsed.data.name.trim(),
					register_no: parsed.data.register_no.trim(),
					serial_number: parsed.data.serial_number.trim(),
					year: parsed.data.year.trim(),
				}),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				setAddError(json.error ?? "Failed to add student.");
				return;
			}
			setAddOpen(false);
			fetchStudents();
		} catch {
			setAddError("Failed to add student.");
		} finally {
			setAddSubmitting(false);
		}
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
				<Button onClick={openAddDialog} variant="default">
					<Plus className="size-4" />
					Add
				</Button>
			</div>

			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add student</DialogTitle>
						<DialogDescription>
							Fill in the student details. All text is stored in uppercase.
						</DialogDescription>
					</DialogHeader>
					<Form {...addForm}>
						<form
							onSubmit={addForm.handleSubmit(handleAddSubmit)}
							className="grid gap-4"
						>
							{addError && (
								<p className="text-destructive text-sm">{addError}</p>
							)}
							<FormField
								control={addForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(e) => field.onChange(e.target.value.toUpperCase())}
												placeholder="Student name"
												className="uppercase"
												autoComplete="off"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={addForm.control}
								name="register_no"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Register No</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(e) => field.onChange(e.target.value.toUpperCase())}
												placeholder="Register number"
												className="uppercase"
												autoComplete="off"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={addForm.control}
								name="serial_number"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Serial Number</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(e) => field.onChange(e.target.value.toUpperCase())}
												placeholder="Serial number"
												className="uppercase"
												autoComplete="off"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={addForm.control}
								name="year"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Year</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(e) => {
													const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
													field.onChange(digits);
												}}
												placeholder="2025 (4 digits only)"
												maxLength={4}
												inputMode="numeric"
												autoComplete="off"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setAddOpen(false)}
									disabled={addSubmitting}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={addSubmitting}>
									{addSubmitting ? "Adding…" : "Add student"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!studentToEdit}
				onOpenChange={(open) => !open && setStudentToEdit(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit student</DialogTitle>
						<DialogDescription>
							Update the student details. All fields are required. All text is stored in uppercase.
						</DialogDescription>
					</DialogHeader>
					<Form {...editForm}>
						<form
							onSubmit={editForm.handleSubmit(handleEditSubmit)}
							className="grid gap-4"
						>
							{editError && (
								<p className="text-destructive text-sm">{editError}</p>
							)}
							<FormField
								control={editForm.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(e) => field.onChange(e.target.value.toUpperCase())}
												placeholder="Student name"
												className="uppercase"
												autoComplete="off"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={editForm.control}
								name="register_no"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Register No</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(e) => field.onChange(e.target.value.toUpperCase())}
												placeholder="Register number"
												className="uppercase"
												autoComplete="off"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={editForm.control}
								name="serial_number"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Serial Number</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(e) => field.onChange(e.target.value.toUpperCase())}
												placeholder="Serial number"
												className="uppercase"
												autoComplete="off"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={editForm.control}
								name="year"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Year</FormLabel>
										<FormControl>
											<Input
												{...field}
												onChange={(e) => {
													const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
													field.onChange(digits);
												}}
												placeholder="2025 (4 digits only)"
												maxLength={4}
												inputMode="numeric"
												autoComplete="off"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setStudentToEdit(null)}
									disabled={editSubmitting}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={editSubmitting}>
									{editSubmitting ? "Saving…" : "Save changes"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<Dialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete student</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete{" "}
							<strong>{studentToDelete?.name}</strong> (Register No: {studentToDelete?.register_no})?
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					{deleteError && (
						<p className="text-destructive text-sm">{deleteError}</p>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setStudentToDelete(null)}
							disabled={deleteSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={deleteSubmitting}
						>
							{deleteSubmitting ? "Deleting…" : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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
									key={student.id}
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
												onClick={() => openEditDialog(student)}
												aria-label="Edit"
											>
												<SquarePen className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="size-8 text-destructive hover:text-destructive"
												onClick={() => handleDeleteClick(student)}
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
