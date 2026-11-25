import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 10;
// DEĞİŞİKLİK: Son aramalar için maksimum çip sayisi tanimlandi
const MAX_RECENT_SEARCHES = 5;
const COUNT = 50;
const API_URL = `https://dummyjson.com/products/category/groceries?limit=${COUNT}`;

export default function App() {
  // 1. DURUM (STATE)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // DEĞİŞİKLİK: Son 5 aramayi tutan state eklendi
  const [recentSearches, setRecentSearches] = useState([]);

  // DEĞİŞİKLİK: Arama terimini son 5 arama listesine başa ekleyip tekrarlari temizleyen yardimci fonksiyon
  const recordSearch = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const withoutDuplicate = prev.filter(
        (item) => item.toLocaleLowerCase('tr') !== trimmed.toLocaleLowerCase('tr')
      );
      return [trimmed, ...withoutDuplicate].slice(0, MAX_RECENT_SEARCHES);
    });
  };

  // 2. VERİYİ ÇEK
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error(`Hata: ${res.status}`);
      }
      const data = await res.json();
      setProducts(data.products || []);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri alinamadi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = products
    .filter((item) => {
      if (!normalizedQuery) return true;
      const title = (item.title ?? '').toLowerCase();
      const category = (item.category ?? '').toLowerCase();
      return title.includes(normalizedQuery) || category.includes(normalizedQuery);
    })
    .sort((a, b) => {
      const titleA = a.title ?? '';
      const titleB = b.title ?? '';
      return sortAsc
        ? titleA.localeCompare(titleB, 'tr')
        : titleB.localeCompare(titleA, 'tr');
    });

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  // 3. EKRAN
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Gida Ürünleri</Text>

        <TextInput
          style={styles.search}
          placeholder="Ürün adi veya kategori ara..."
          value={query}
          returnKeyType="search"
          onChangeText={(text) => {
            setQuery(text);
            setVisibleCount(PAGE_SIZE);
          }}
          // DEĞİŞİKLİK: Klavyede ara/bitti basildiğinda son aramalara kaydedildi
          onSubmitEditing={() => recordSearch(query)}
          // DEĞİŞİKLİK: Arama kutusundan çikildiğinda doluysa son aramalara kaydedildi
          onBlur={() => recordSearch(query)}
        />

        {/* DEĞİŞİKLİK: Arama kutusunun altinda son 5 aramayi çip olarak gösteren alan eklendi */}
        {recentSearches.length > 0 && (
          <View style={styles.recentRow}>
            {recentSearches.map((item) => (
              <Pressable
                key={item}
                style={styles.sortButton}
                onPress={() => {
                  setQuery(item);
                  setVisibleCount(PAGE_SIZE);
                  recordSearch(item);
                }}
              >
                <Text style={styles.sortText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          style={styles.sortButton}
          onPress={() => {
            setSortAsc((prev) => !prev);
          }}
        >
          <Text style={styles.sortText}>{sortAsc ? 'A → Z' : 'Z → A'}</Text>
        </Pressable>

        {!loading && !error && (
          <Text style={styles.info}>
            {visibleProducts.length} / {filteredProducts.length} ürün gösteriliyor
          </Text>
        )}

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retry} onPress={fetchProducts}>
              <Text style={styles.retryText}>Tekrar Dene</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={visibleProducts}
            keyExtractor={(item, index) => String(item.id ?? index)}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={<Text style={styles.empty}>Ürün bulunamadi.</Text>}
            ListFooterComponent={
              hasMore ? (
                <Pressable
                  style={styles.sortButton}
                  onPress={() =>
                    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredProducts.length))
                  }
                >
                  <Text style={styles.sortText}>Daha fazla</Text>
                </Pressable>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Image source={{ uri: item.thumbnail }} style={styles.avatar} />
                <View style={styles.rowText}>
                  <Text style={styles.name}>{item.title}</Text>
                  <Text style={styles.detail}>
                    {item.category} · ${item.price}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// 4. STİLLER (HAZIR – DOKUNMAYIN)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  placeholder: {
    padding: 32,
    textAlign: 'center',
    color: '#94a3b8',
  },
  loader: {
    marginTop: 40,
  },
  info: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 13,
    color: '#475569',
  },
  errorBox: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  retry: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#b91c1c',
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  search: {
    height: 44,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  detail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginLeft: 76,
    backgroundColor: '#e2e8f0',
  },
  empty: {
    padding: 32,
    textAlign: 'center',
    color: '#94a3b8',
  },
  sortButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#e0e7ff',
  },
  sortText: {
    color: '#3730a3',
    fontWeight: '700',
  },
  // DEĞİŞİKLİK: Çipleri yan yana sararak dizmek için satir kapsayici stili eklendi
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingRight: 16,
  },
});