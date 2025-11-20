import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, Filter, X, Calendar, MapPin, DollarSign, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchFilters {
  query: string;
  status: string[];
  region: string[];
  dateFrom: string;
  dateTo: string;
  budgetMin: string;
  budgetMax: string;
  progressMin: string;
  progressMax: string;
}

export const AdvancedSearch: React.FC = () => {
  const { language } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    region: [],
    dateFrom: '',
    dateTo: '',
    budgetMin: '',
    budgetMax: '',
    progressMin: '',
    progressMax: ''
  });

  const statusOptions = [
    { value: 'active', label: language === 'ar' ? 'نشط' : 'Active', color: 'bg-green-500' },
    { value: 'completed', label: language === 'ar' ? 'مكتمل' : 'Completed', color: 'bg-blue-500' },
    { value: 'delayed', label: language === 'ar' ? 'متأخر' : 'Delayed', color: 'bg-red-500' },
    { value: 'pending', label: language === 'ar' ? 'معلق' : 'Pending', color: 'bg-yellow-500' }
  ];

  const regionOptions = [
    language === 'ar' ? 'الرياض' : 'Riyadh',
    language === 'ar' ? 'جدة' : 'Jeddah',
    language === 'ar' ? 'الدمام' : 'Dammam',
    language === 'ar' ? 'مكة' : 'Makkah',
    language === 'ar' ? 'المدينة' : 'Madinah',
    language === 'ar' ? 'أبها' : 'Abha',
    language === 'ar' ? 'تبوك' : 'Tabuk',
    language === 'ar' ? 'القصيم' : 'Qassim'
  ];

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const toggleRegion = (region: string) => {
    setFilters(prev => ({
      ...prev,
      region: prev.region.includes(region)
        ? prev.region.filter(r => r !== region)
        : [...prev.region, region]
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      status: [],
      region: [],
      dateFrom: '',
      dateTo: '',
      budgetMin: '',
      budgetMax: '',
      progressMin: '',
      progressMax: ''
    });
  };

  const handleSearch = () => {
    console.log('Searching with filters:', filters);
    // هنا يتم تطبيق البحث الفعلي
  };

  const activeFiltersCount = 
    filters.status.length + 
    filters.region.length + 
    (filters.dateFrom ? 1 : 0) + 
    (filters.dateTo ? 1 : 0) + 
    (filters.budgetMin ? 1 : 0) + 
    (filters.budgetMax ? 1 : 0) + 
    (filters.progressMin ? 1 : 0) + 
    (filters.progressMax ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="glass-card border-0 shadow-xl animate-fade-in">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'ابحث عن المشاريع...' : 'Search projects...'}
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="pr-12 h-12 text-base font-medium"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6 relative"
            >
              <SlidersHorizontal className="h-5 w-5 ml-2" />
              {language === 'ar' ? 'فلاتر' : 'Filters'}
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Button onClick={handleSearch} className="h-12 px-8 text-base font-semibold">
              <Search className="h-5 w-5 ml-2" />
              {language === 'ar' ? 'بحث' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="glass-card border-0 shadow-xl animate-scale-in">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Filter className="h-6 w-6 text-primary" />
                {language === 'ar' ? 'فلاتر البحث المتقدم' : 'Advanced Search Filters'}
              </CardTitle>
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 ml-1" />
                    {language === 'ar' ? 'مسح الكل' : 'Clear All'}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Status Filter */}
            <div className="space-y-3">
              <label className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'حالة المشروع' : 'Project Status'}
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => toggleStatus(status.value)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all text-base font-semibold ${
                      filters.status.includes(status.value)
                        ? `${status.color} text-white border-transparent`
                        : 'bg-card border-border hover:border-primary'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Region Filter */}
            <div className="space-y-3">
              <label className="text-base font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'المنطقة' : 'Region'}
              </label>
              <div className="flex flex-wrap gap-2">
                {regionOptions.map((region) => (
                  <button
                    key={region}
                    onClick={() => toggleRegion(region)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all text-base font-semibold ${
                      filters.region.includes(region)
                        ? 'bg-primary text-white border-transparent'
                        : 'bg-card border-border hover:border-primary'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <label className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'الفترة الزمنية' : 'Date Range'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    {language === 'ar' ? 'من تاريخ' : 'From Date'}
                  </label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="text-base font-medium"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    {language === 'ar' ? 'إلى تاريخ' : 'To Date'}
                  </label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="text-base font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Budget Range Filter */}
            <div className="space-y-3">
              <label className="text-base font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'الميزانية (ريال)' : 'Budget (SAR)'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    {language === 'ar' ? 'الحد الأدنى' : 'Minimum'}
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.budgetMin}
                    onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                    className="text-base font-medium"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    {language === 'ar' ? 'الحد الأقصى' : 'Maximum'}
                  </label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={filters.budgetMax}
                    onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                    className="text-base font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Progress Range Filter */}
            <div className="space-y-3">
              <label className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'نسبة الإنجاز %' : 'Progress %'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    {language === 'ar' ? 'الحد الأدنى' : 'Minimum'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={filters.progressMin}
                    onChange={(e) => setFilters({ ...filters, progressMin: e.target.value })}
                    className="text-base font-medium"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    {language === 'ar' ? 'الحد الأقصى' : 'Maximum'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="100"
                    value={filters.progressMax}
                    onChange={(e) => setFilters({ ...filters, progressMax: e.target.value })}
                    className="text-base font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button onClick={handleSearch} className="flex-1 h-12 text-base font-semibold">
                <Search className="h-5 w-5 ml-2" />
                {language === 'ar' ? 'تطبيق الفلاتر' : 'Apply Filters'}
              </Button>
              <Button variant="outline" onClick={clearFilters} className="h-12 px-6 text-base font-semibold">
                {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <Card className="glass-card border-0 shadow-lg animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">
                  {language === 'ar' ? 'الفلاتر النشطة:' : 'Active Filters:'}
                </span>
                <Badge variant="secondary" className="text-base">
                  {activeFiltersCount}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 ml-1" />
                {language === 'ar' ? 'مسح الكل' : 'Clear All'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
